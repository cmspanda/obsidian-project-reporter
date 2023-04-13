#!/usr/bin/env node

import fs, { opendir } from 'fs/promises';
import path from 'path';
import { parseAllDocuments } from 'yaml';
import { generateTable, generateDashboard } from './converters/ArrayToMarkdown.js';

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

let saveMarkdownTable = async (output, contents) => {
    
    let filePath = output.substring(0, output.lastIndexOf(path.sep));

    try {
        await opendir(filePath);
    } catch (err) {
        console.log(`Directory doesn't exist, creating new dir at ${filePath}`);
        await fs.mkdir(filePath, { recursive: true });    
    }

    await fs.writeFile(output, contents);
}

console.dir(args);

await parseFolder(allRecords, args[0]); 
let dashboardmarkup = await generateDashboard(allRecords);

await saveMarkdownTable(args[1], `# PROJECT DASHBOARD \n\n${dashboardmarkup}`);


