#!/usr/bin/env node

import fs, { opendir } from 'fs/promises';
import path from 'path';
import { parseAllDocuments } from 'yaml';
import { Parser as JsonToCsv } from '@json2csv/plainjs';
import CsvToMarkdown from 'csv-to-markdown-table';

// TODO: Create Regex to get parent and up to sub-projects (check Arnimus for example);
const FOLDER_REGEX = /[\w\s]+\/[^\\]+\.[\w]{0,5}$/;

let allRecords = [];
const args = process.argv.slice(2);

let parseFolder = async (allRecords, folder) => {
    try {
        let files = await fs.readdir(folder);
        for (let file of files) {
            console.log(file);
            let filePath = path.join(folder, file);
            let stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                await parseFolder(allRecords, filePath);
            } else {
                allRecords.push(await parseFile(filePath));
            }
        }
    } catch (err) {
        console.log(`ERROR while processing: ${folder}`)
        console.log(err);
    }
}

let parseFile = async (fileName) => {
    
    const file = await fs.readFile(fileName, 'utf8');

    let folder = fileName.substring(FOLDER_REGEX.exec(fileName).index);
    folder = folder.substring(0, folder.lastIndexOf(path.sep));
    
    let record = { Project: folder };
    record["Task"] = path.basename(fileName.replace(path.extname(fileName), ""));
    
    let data = parseAllDocuments(file);
    data[0].contents.items.forEach(item => {
        let value = item.value.value; 
        if (item.value.items) {
            let values = [];
            for ( let i of item.value.items ) {
                values.push(i.value);
            }
            value = values.join(',');
        };
        record[item.key.value] = value;
    })

    return record;
}

let saveMarkdownTable = async (arr, output) => {
    
    const p = new JsonToCsv({});
    let tableMarkdown = CsvToMarkdown(p.parse(arr),",",true);
    let filePath = output.substring(0, output.lastIndexOf(path.sep));

    try {
        await opendir(filePath);
    } catch (err) {
        console.log(`Directory doesn't exist, creating new dir at ${filePath}`);
        await fs.mkdir(filePath, { recursive: true });    
    }

    await fs.writeFile(output, tableMarkdown);
}

await parseFolder(allRecords, args[0]); 
await saveMarkdownTable(allRecords, args[1]);

