// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::Path;
use std::{ffi::OsStr, fs::File, os::unix::ffi::OsStrExt};

use polars::io::{csv::CsvReader, SerReader};
use tauri::Error;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn execute_python_code(code: String) -> Result<String, String> {
    use std::process::{Command, Stdio};

    let child = Command::new("python")
        .arg("-c")
        .arg(code)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to execute Python code.");

    let output = child.wait_with_output().expect("Failed to read stdout");

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[derive(serde::Serialize)]
struct Directory {
    files: Vec<String>,
    directories: Vec<Directory>,
}

#[tauri::command]
fn open_directory(path: String) -> Result<Directory, String> {
    use std::fs;
    let paths = fs::read_dir(path)
        .map_err(|e| e.to_string())
        .map_err(|err| err.to_string())?
        .filter_map(|entry| entry.ok().and_then(|e| e.path().to_str().map(String::from)))
        .collect();

    Ok(Directory {
        files: paths,
        directories: vec![],
    })
}

#[cfg(test)]
mod tests {
    use std::{fs::File, time::Instant};

    use polars::{
        io::{csv::CsvReader, SerReader},
        lazy::frame::{LazyCsvReader, LazyFileListReader},
    };

    #[test]
    fn test_csv_stats() {
        let csv_path = "/Users/pedro/Downloads/FoodData_Central_csv_2023-10-26/branded_food.csv";
        let start = Instant::now();
        let df = CsvReader::from_path(csv_path)
            .unwrap()
            .with_ignore_errors(true)
            .finish()
            .unwrap();

        println!("{:?}", start.elapsed());
        println!("{}", df);
    }
}
#[derive(serde::Serialize)]
struct CSVData {
    file_size: u64,
    lines: Vec<Vec<String>>,
    fields: Vec<String>,
}

fn get_delimeter(path: &str, custom_delim: &str) -> Option<u8> {
    let cdelim: u8 = str_to_delim(custom_delim);

    if cdelim != b',' {
        return Some(cdelim);
    }
    let ext = Path::new(path).extension().and_then(OsStr::to_str);
    ext.map(|e| match e {
        "csv" => b',',
        "tsv" => b'\t',
        _ => b',',
    })
}

fn str_to_delim(s: &str) -> u8 {
    if let Some(c) = s.chars().next() {
        if c == ',' {
            return b',';
        }
        return c.try_into().unwrap_or(b',');
    }
    b','
}

#[tauri::command]
async fn open_csv(csv_path: &str, custom_delim: &str) -> Result<CSVData, String> {
    if let Some(delim) = get_delimeter(csv_path, custom_delim) {
        let file = File::open(csv_path).map_err(|err| err.to_string())?;
        let file_size = file.metadata().unwrap().len();
        let mut rdr = csv::ReaderBuilder::new()
            .delimiter(delim)
            .flexible(true)
            .from_reader(file);
        let fields = rdr
            .headers()
            .unwrap()
            .iter()
            .map(|h| h.to_string())
            .collect::<Vec<String>>();

        let mut records = rdr
            .records()
            .take(10)
            .map(|e| {
                e.unwrap()
                    .iter()
                    .map(|s| s.to_string())
                    .collect::<Vec<String>>()
            })
            .collect::<Vec<Vec<String>>>();

        let mut header = vec![fields.clone()];

        let mut lines = Vec::new();
        lines.append(&mut header);
        lines.append(&mut records);
        Ok(CSVData {
            file_size,
            fields,
            lines,
        })
    } else {
        Err(String::from("Unsupported extension"))
    }
}

// #[tauri::command]
// async fn open_csv_details(csv_path: &str) -> Result<CSVData, String> {
//     use csv::ReaderBuilder;
//
//     let fields = {
//         let df = CsvReader::new(File::open(csv_path).map_err(|err| err.to_string())?)
//             .with_n_rows(Some(10))
//             .infer_schema(Some(10))
//             .with_ignore_errors(true)
//             .finish()
//             .unwrap();
//
//         let fields = df
//             .fields()
//             .iter()
//             .map(|f| f.name().to_string())
//             .collect::<Vec<String>>();
//         fields
//     };
//     // Create a CSV reader with default configuration.
// }

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            execute_python_code,
            open_directory,
            open_csv
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
