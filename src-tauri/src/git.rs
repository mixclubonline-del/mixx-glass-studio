/**
 * Git Operations Module
 * what: Tauri commands for git repository operations
 * why: Enable auto-pull functionality from Rust backend
 * how: Execute git commands via std::process
 */

use serde_json;
use std::process::Command;
use std::path::PathBuf;

#[tauri::command]
pub fn git_status() -> Result<serde_json::Value, String> {
    let repo_path = get_repo_path()?;
    
    // Get current branch
    let branch_output = Command::new("git")
        .args(["-C", &repo_path, "rev-parse", "--abbrev-ref", "HEAD"])
        .output()
        .map_err(|e| format!("Failed to get branch: {}", e))?;
    
    if !branch_output.status.success() {
        let error_msg = String::from_utf8_lossy(&branch_output.stderr);
        return Err(format!("Failed to get branch: {}", error_msg));
    }
    
    let branch = String::from_utf8_lossy(&branch_output.stdout).trim().to_string();
    
    // Check for uncommitted changes
    let status_output = Command::new("git")
        .args(["-C", &repo_path, "status", "--porcelain"])
        .output()
        .map_err(|e| format!("Failed to get status: {}", e))?;
    
    if !status_output.status.success() {
        let error_msg = String::from_utf8_lossy(&status_output.stderr);
        return Err(format!("Failed to get status: {}", error_msg));
    }
    
    let has_changes = !status_output.stdout.is_empty();
    
    // Check if branch is ahead/behind
    let ahead_behind_output = Command::new("git")
        .args(["-C", &repo_path, "rev-list", "--left-right", "--count", &format!("origin/{}...HEAD", branch)])
        .output();
    
    let (ahead, behind) = match ahead_behind_output {
        Ok(output) => {
            if !output.status.success() {
                // If rev-list fails (e.g., no remote tracking branch), default to (0, 0)
                (0, 0)
            } else {
                let counts = String::from_utf8_lossy(&output.stdout);
                let parts: Vec<&str> = counts.trim().split('\t').collect();
                if parts.len() == 2 {
                    // git rev-list --left-right --count returns: behind<tab>ahead
                    // parts[0] = commits in origin not in HEAD (behind)
                    // parts[1] = commits in HEAD not in origin (ahead)
                    (
                        parts[1].parse::<i32>().unwrap_or(0), // ahead
                        parts[0].parse::<i32>().unwrap_or(0), // behind
                    )
                } else {
                    (0, 0)
                }
            }
        }
        Err(_) => (0, 0),
    };
    
    // Check for merge conflicts
    // git diff --check returns success (0) when NO conflicts, failure (1) when conflicts exist
    let conflict_output = Command::new("git")
        .args(["-C", &repo_path, "diff", "--check"])
        .output();
    
    let has_conflicts = match conflict_output {
        Ok(output) => !output.status.success(), // Conflicts exist when command fails
        Err(_) => false,
    };
    
    Ok(serde_json::json!({
        "branch": branch,
        "hasChanges": has_changes,
        "hasConflicts": has_conflicts,
        "ahead": ahead,
        "behind": behind,
    }))
}

#[tauri::command]
pub fn git_pull() -> Result<String, String> {
    let repo_path = get_repo_path()?;
    
    let output = Command::new("git")
        .args(["-C", &repo_path, "pull", "--no-edit"])
        .output()
        .map_err(|e| format!("Failed to execute git pull: {}", e))?;
    
    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Git pull failed: {}", error_msg));
    }
    
    let result = String::from_utf8_lossy(&output.stdout);
    Ok(result.to_string())
}

#[tauri::command]
pub fn git_fetch() -> Result<String, String> {
    let repo_path = get_repo_path()?;
    
    let output = Command::new("git")
        .args(["-C", &repo_path, "fetch"])
        .output()
        .map_err(|e| format!("Failed to execute git fetch: {}", e))?;
    
    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Git fetch failed: {}", error_msg));
    }
    
    let result = String::from_utf8_lossy(&output.stdout);
    Ok(result.to_string())
}

fn get_repo_path() -> Result<String, String> {
    // Get the current working directory
    // In Tauri, we can use the app's resource directory or detect the repo
    let current_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;
    
    // Try to find .git directory by walking up the tree
    let mut path = PathBuf::from(&current_dir);
    loop {
        let git_dir = path.join(".git");
        if git_dir.exists() {
            return Ok(path.to_string_lossy().to_string());
        }
        
        if !path.pop() {
            break;
        }
    }
    
    // Fallback: use current directory
    Ok(current_dir.to_string_lossy().to_string())
}

