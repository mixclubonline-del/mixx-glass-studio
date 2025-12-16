// AURA Local LLM Commands
// Phase 37: Proprietary LLM Integration
//
// Provides Tauri commands for local LLM inference using Ollama.
// Falls back gracefully if Ollama is not installed.

use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMStatus {
    pub available: bool,
    pub provider: String,
    pub model: Option<String>,
    pub models: Vec<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMCompletion {
    pub content: String,
    pub model: String,
    pub provider: String,
    pub tokens: LLMTokens,
    pub latency_ms: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMTokens {
    pub prompt: usize,
    pub completion: usize,
    pub total: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMMessage {
    pub role: String,
    pub content: String,
}

/// Check if Ollama is available
#[tauri::command]
pub async fn llm_check_ollama() -> Result<LLMStatus, String> {
    // Try to connect to Ollama
    let result = reqwest::Client::new()
        .get("http://localhost:11434/api/tags")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await;
    
    match result {
        Ok(response) => {
            if response.status().is_success() {
                // Parse models
                let body: serde_json::Value = response.json().await.unwrap_or_default();
                let models: Vec<String> = body["models"]
                    .as_array()
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|m| m["name"].as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();
                
                let default_model = models.first().cloned();
                
                Ok(LLMStatus {
                    available: true,
                    provider: "ollama".to_string(),
                    model: default_model,
                    models,
                    error: None,
                })
            } else {
                Ok(LLMStatus {
                    available: false,
                    provider: "none".to_string(),
                    model: None,
                    models: vec![],
                    error: Some("Ollama returned error".to_string()),
                })
            }
        }
        Err(e) => {
            Ok(LLMStatus {
                available: false,
                provider: "none".to_string(),
                model: None,
                models: vec![],
                error: Some(format!("Ollama not running: {}", e)),
            })
        }
    }
}

/// Generate completion using Ollama
#[tauri::command]
pub async fn llm_complete(
    prompt: String,
    model: Option<String>,
    system_prompt: Option<String>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
) -> Result<LLMCompletion, String> {
    use std::time::Instant;
    
    let start = Instant::now();
    let model_name = model.unwrap_or_else(|| "llama3.2:3b".to_string());
    
    // Build messages
    let mut messages = vec![];
    
    if let Some(sys) = system_prompt {
        messages.push(serde_json::json!({
            "role": "system",
            "content": sys
        }));
    }
    
    messages.push(serde_json::json!({
        "role": "user",
        "content": prompt
    }));
    
    // Build request body
    let body = serde_json::json!({
        "model": model_name,
        "messages": messages,
        "stream": false,
        "options": {
            "temperature": temperature.unwrap_or(0.7),
            "num_predict": max_tokens.unwrap_or(1024)
        }
    });
    
    // Send request
    let response = reqwest::Client::new()
        .post("http://localhost:11434/api/chat")
        .json(&body)
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Ollama error: {}", response.status()));
    }
    
    let data: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    let content = data["message"]["content"]
        .as_str()
        .unwrap_or("")
        .to_string();
    
    let latency_ms = start.elapsed().as_millis() as u64;
    
    // Estimate tokens
    let prompt_tokens = prompt.len() / 4;
    let completion_tokens = content.len() / 4;
    
    Ok(LLMCompletion {
        content,
        model: model_name,
        provider: "ollama".to_string(),
        tokens: LLMTokens {
            prompt: prompt_tokens,
            completion: completion_tokens,
            total: prompt_tokens + completion_tokens,
        },
        latency_ms,
    })
}

/// List available models
#[tauri::command]
pub async fn llm_list_models() -> Result<Vec<serde_json::Value>, String> {
    let response = reqwest::Client::new()
        .get("http://localhost:11434/api/tags")
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Ollama not available".to_string());
    }
    
    let data: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    let models = data["models"]
        .as_array()
        .map(|arr| arr.to_vec())
        .unwrap_or_default();
    
    Ok(models)
}

/// Pull a model from Ollama registry
#[tauri::command]
pub async fn llm_pull_model(model: String) -> Result<String, String> {
    let body = serde_json::json!({
        "name": model,
        "stream": false
    });
    
    let response = reqwest::Client::new()
        .post("http://localhost:11434/api/pull")
        .json(&body)
        .timeout(std::time::Duration::from_secs(600)) // 10 min timeout for large models
        .send()
        .await
        .map_err(|e| format!("Failed to pull model: {}", e))?;
    
    if response.status().is_success() {
        Ok(format!("Model {} pulled successfully", model))
    } else {
        Err(format!("Failed to pull model: {}", response.status()))
    }
}

/// Get AURA-specific mixing suggestion
#[tauri::command]
pub async fn llm_aura_mixing_suggestion(
    genre: Option<String>,
    bpm: Option<u32>,
    key: Option<String>,
) -> Result<LLMCompletion, String> {
    let system_prompt = r#"You are AURA, an AI assistant specialized in music production, mixing, and mastering.
Provide concise, actionable mixing suggestions based on the context.
Be specific with settings and parameters when possible."#;

    let context_parts: Vec<String> = vec![
        genre.map(|g| format!("Genre: {}", g)),
        bpm.map(|b| format!("BPM: {}", b)),
        key.map(|k| format!("Key: {}", k)),
    ].into_iter().flatten().collect();
    
    let context = if context_parts.is_empty() {
        "general music project".to_string()
    } else {
        context_parts.join(", ")
    };
    
    let prompt = format!(
        "Provide 3-5 specific mixing suggestions for this {} project. Focus on EQ, compression, and spatial elements.",
        context
    );
    
    llm_complete(prompt, None, Some(system_prompt.to_string()), Some(0.7), Some(512)).await
}
