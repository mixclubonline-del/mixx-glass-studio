#!/usr/bin/env python3
"""
Fabric-side fine-tuning script for Prime Brain.

Trains an instruction-following model on sanitized datasets produced by the Fabric pipeline.
"""

import argparse
import json
import os
from pathlib import Path
from typing import Dict, List

from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
)


def parse_args():
    parser = argparse.ArgumentParser(description="Train Prime Brain instruction model.")
    parser.add_argument("--dataset_dir", required=True, help="Directory containing train.jsonl and validation.jsonl")
    parser.add_argument("--output_dir", required=True, help="Directory to store trained weights and logs")
    parser.add_argument("--base_model", default="google/gemma-2b-it", help="Base checkpoint to fine-tune")
    parser.add_argument("--max_steps", type=int, default=300)
    parser.add_argument("--learning_rate", type=float, default=2e-5)
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--gradient_accumulation", type=int, default=4)
    parser.add_argument("--warmup_steps", type=int, default=30)
    parser.add_argument("--weight_decay", type=float, default=0.01)
    parser.add_argument("--mixed_precision", default="bf16", choices=["bf16", "fp16", "no"])
    parser.add_argument("--save_steps", type=int, default=100)
    parser.add_argument("--eval_steps", type=int, default=100)
    return parser.parse_args()


def load_prime_brain_dataset(dataset_dir: Path):
    data_files = {
        "train": str(dataset_dir / "train.jsonl"),
        "validation": str(dataset_dir / "validation.jsonl"),
    }
    dataset = load_dataset("json", data_files=data_files)
    return dataset


def format_prompt(prompt: str, response: str) -> str:
    return f"<|prime_brain_prompt|>\n{prompt.strip()}\n<|prime_brain_response|>\n{response.strip()}"


def main():
    args = parse_args()

    dataset_dir = Path(args.dataset_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    dataset = load_prime_brain_dataset(dataset_dir)

    tokenizer = AutoTokenizer.from_pretrained(args.base_model, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    def preprocess(batch: Dict[str, List[str]]):
        formatted = [format_prompt(p, r) for p, r in zip(batch["prompt"], batch["response"])]
        tokenized_batch = tokenizer(formatted, truncation=True, max_length=2048)
        tokenized_batch["labels"] = tokenized_batch["input_ids"].copy()
        return tokenized_batch

    tokenized = dataset.map(
        preprocess,
        batched=True,
        remove_columns=dataset["train"].column_names,
    )

    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    model = AutoModelForCausalLM.from_pretrained(args.base_model)

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        overwrite_output_dir=True,
        num_train_epochs=1,
        max_steps=args.max_steps,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=max(1, args.batch_size // 2),
        gradient_accumulation_steps=args.gradient_accumulation,
        evaluation_strategy="steps",
        eval_steps=args.eval_steps,
        save_steps=args.save_steps,
        save_total_limit=2,
        learning_rate=args.learning_rate,
        warmup_steps=args.warmup_steps,
        weight_decay=args.weight_decay,
        logging_steps=20,
        bf16=args.mixed_precision == "bf16",
        fp16=args.mixed_precision == "fp16",
        report_to=["none"],
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized["train"],
        eval_dataset=tokenized["validation"],
        data_collator=data_collator,
    )

    trainer.train()
    metrics = trainer.evaluate()

    trainer.save_model(str(output_dir / "checkpoint-final"))
    tokenizer.save_pretrained(str(output_dir / "checkpoint-final"))

    metrics_path = output_dir / "metrics.json"
    with metrics_path.open("w", encoding="utf-8") as fp:
        json.dump(metrics, fp, indent=2)

    print("Training complete.")
    print(f"Metrics saved to {metrics_path}")


if __name__ == "__main__":
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    main()

