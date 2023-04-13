import { Parser as JsonToCsv } from '@json2csv/plainjs';
import CsvToMarkdown from 'csv-to-markdown-table';

const PROJECTS = "/Projects";
const RESERVED_KEYS = [
    "Due",
    "Complete",
    "Tags",
    "Description",
    "Task"
]

const IGNORED_KEYS = [
    "Project",
]

export const generateTable = (arr) => {
    const p = new JsonToCsv({});
    let tableMarkdown = CsvToMarkdown(p.parse(arr),",",true);

    return tableMarkdown;
}

export const generateDashboard = async (arr) => {
    const dashboardJson = generateDashboardJson(arr);

    let markup = "";
    for (let i in dashboardJson) {
        markup += generateProjectMarkup(i, dashboardJson[i].Tasks);
    }
    
    return markup;
}

const generateProjectMarkup = (projectName, tasks) => {

    let taskMarkup = "";

    for (let task in tasks) {
        taskMarkup += generateTaskMarkup(tasks[task]); 
    }

    return [
        `<div class="project-group"><h2>${projectName}</h2>`,
            `<div class="project-tasks">${taskMarkup}</div>`,
        `</div>`
    ].join("");
}

const generateTaskMarkup = (task) => {

    let otherTaskMarkup = "";

    for (let x in task.OtherKeys) {
        otherTaskMarkup += [
            `<div class="additional-detail">`,
                `<div class="additional-detail-header">${x}</div>`,
                `<div class="additional-detail-value">${task.OtherKeys[x]}</div>`,
            `</div>`
        ].join("");
    }

    return [
    `<div class="task-card"><div class="task-header">${task.Task}</div>`,
        `<div class="task-details">`,
            `<div class="task-vitals">`,
                `<div class="vital-sign vital-due"><div class="vital-sign-header">Due</div><div class="vital-sign-value">${task.Due || ''}</div></div>`,
                `<div class="vital-sign vital-complete"><div class="vital-sign-header">Complete</div><div class="vital-sign-value">${task.Complete || ''}</div></div>`,
                `<div class="vital-sign vital-tags"><div class="vital-sign-header">Tags</div><div class="vital-sign-value">${task.Tags || ''}</div></div>`,
            `</div>`,
             `<div class="task-description">${task.Description || ""}</div>`,
            `<div class="task-additional-details">${otherTaskMarkup}</div>`,
        `</div>`,
    `</div>`
    ].join("");
}

const generateDashboardJson = (arr) => {
    let dashboardJson = {};

    arr.forEach(item => {

        if (item.Project.indexOf(PROJECTS) + PROJECTS.length == item.Project.length) {
            return;
        }

        let project = processProjectName(item.Project);

        // Adjust the project to remove the prior path
        dashboardJson[project] = dashboardJson[project] || {};
        dashboardJson[project].Tasks = dashboardJson[project].Tasks || [];
        dashboardJson[project].Tasks[item.Task] = dashboardJson[project].Tasks[item.Task] || {};
        
        // Create the task object
        try {
            let task = dashboardJson[project].Tasks[item.Task] || {};
            RESERVED_KEYS.forEach((key) => {
                task[key] = task[key] || item[key];
            })
            
            for (let key of Object.keys(item)) {
                if (!(RESERVED_KEYS.includes(key) || IGNORED_KEYS.includes(key))) {
                    task.OtherKeys = task.OtherKeys || {};
                    task.OtherKeys[key] = item[key];    
                }
            }
            
        } catch (e) {
            console.log(`Error with the following item:`);
            console.log(item);
            console.log(e);
        }
    })
    
    return dashboardJson;
}

const processProjectName = (path) => {
    return path.substr(path.indexOf(PROJECTS) + PROJECTS.length + 1, path.length);
}