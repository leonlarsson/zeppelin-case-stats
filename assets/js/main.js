import { ZeppelinCaseTypes, ModFileTypes } from "./constants.js";

const helpText = document.getElementById("helpText");
const allModsCheckbox = document.getElementById("allModsCheckbox");
const allModsCheckboxText = document.getElementById("allModsCheckboxText");
const modsUploadButton = document.getElementById("modsUploadButton");
const caseUploadButton = document.getElementById("caseUploadButton");
const modsUpload = document.getElementById("modsUpload");
const caseUpload = document.getElementById("caseUpload");
const resetButton = document.getElementById("resetButton");
const table = document.getElementById("caseTable");
const downloadButtonJSON = document.getElementById("downloadButtonJSON");
const downloadButtonCSV = document.getElementById("downloadButtonCSV");
const downloadButtonHTML = document.getElementById("downloadButtonHTML");
const downloadButtonXLSX = document.getElementById("downloadButtonXLSX");
const downloadButtonPDF = document.getElementById("downloadButtonPDF");

const calcSumNumbers = values => {
    let sum = 0;
    values.forEach(value => {
        const num = value.match(/(\d+) \(/)[1];
        sum += parseInt(num);
    });
    return sum;
}

const calcSumMods = values => {
    return values.length + " moderators";
}

// Do not use pagination if the localStorage setting overrides it (is set to false)
const usePagination = !localStorage.getItem("usePagination") || localStorage.getItem("usePagination") === "true" ? true : false;

// Create the table
const coolTable = new Tabulator(table, {
    pagination: usePagination,
    paginationSize: 20,
    paginationCounter: "rows",
    placeholder: "Upload some data for me.",
    layout: "fitDataStretch", // This fills the width and creates a scrollbar before it gets mushy
    // footerElement: "<button class='button buttonBlue'>Custom Button</button>",

    // By default, sort by cases, descending
    initialSort: [
        { column: "cases", dir: "desc" }
    ],

    columnDefaults: {
        headerTooltip: true,
        tooltip: cell => {
            // If the cell is missing this value, it's probably a sum cell, so return
            if (!cell.getColumn()._column.definition.title) return;
            return `${cell.getRow()._row.data.name} (${cell.getRow()._row.data.id}): ${cell.getColumn()._column.definition.title} - ${cell.getValue()}`;
        },
    },

    columns: [
        {
            title: "Basic Info",
            columns: [
                { title: "ID", field: "id", headerFilter: true, sorter: "number", topCalc: calcSumMods },
                { title: "Name", field: "name", headerFilter: true }
            ]
        },
        {
            title: "Case Stats",
            columns: [
                { title: "Cases", field: "cases", sorter: "number", topCalc: calcSumNumbers },
                { title: "Bans", field: "caseCounts.BAN", sorter: "number", topCalc: calcSumNumbers },
                { title: "Unbans", field: "caseCounts.UNBAN", sorter: "number", topCalc: calcSumNumbers },
                { title: "Notes", field: "caseCounts.NOTE", sorter: "number", topCalc: calcSumNumbers },
                { title: "Warnings", field: "caseCounts.WARNING", sorter: "number", topCalc: calcSumNumbers },
                { title: "Kicks", field: "caseCounts.KICK", sorter: "number", topCalc: calcSumNumbers },
                { title: "Mutes", field: "caseCounts.MUTE", sorter: "number", topCalc: calcSumNumbers },
                { title: "Unmutes", field: "caseCounts.UNMUTE", sorter: "number", topCalc: calcSumNumbers }
            ]
        }
    ]
});

// Receive the mod list file
let modsList;
let typeOfModFile;
modsUpload.addEventListener("change", event => {

    // Create new FileReader
    const reader = new FileReader();
    reader.onload = event => {

        // If file cannot be parsed into JSON, return and alert.
        try {
            modsList = JSON.parse(event.target.result);
        } catch (error) {
            return alert("Could not parse JSON. Not valid JSON. \n\n" + error);
        }

        // Since the file is valid JSON, determine if the file is object-based or just an array of strings (IDs)
        if (Array.isArray(modsList) && modsList.every(x => x.id && typeof x.id === "string" && x.name && typeof x.name === "string")) {
            typeOfModFile = ModFileTypes.TYPE_OBJECT;
        } else if (Array.isArray(modsList) && modsList.every(x => x && typeof x === "string")) {
            typeOfModFile = ModFileTypes.TYPE_ID_ARRAY;
        } else {
            return alert("File is valid JSON, but the format is not supported.\nTo see all supported formats, see the help page.");
        }

        console.log("[DEBUG]: Loaded mods list data:\n", modsList);

        // Change visibility
        allModsCheckbox.hidden = true;
        allModsCheckboxText.hidden = true;
        caseUploadButton.hidden = false;
        modsUploadButton.hidden = true;
        resetButton.hidden = false;
    }

    // Read file
    reader.readAsText(event.target.files[0]);

    // Clear input value to allow for more uploads
    modsUpload.value = null;
});

// Receive the case export file
caseUpload.addEventListener("change", event => {

    // Create new FileReader
    const reader = new FileReader();
    reader.onload = event => {

        let caseData;
        try {
            caseData = JSON.parse(event.target.result);
        } catch (error) {
            return alert("Could not parse JSON. Not valid JSON. \n\n" + error);
        }

        // If received data does not have an array called "cases" or if there are no cases, return and notify
        if (!Array.isArray(caseData.cases)) return alert('Could not find array "cases".\nIs this a Zeppelin export file?');
        if (!caseData.cases.length) return alert("Found an array of cases, but there are no cases there.");

        // Create a set and add each mod_id (where mod_id is not "0", where it exists, and where it doesn't equal user_id (automod))
        const set = new Set();
        caseData.cases.filter(inf => inf.mod_id !== "0" && inf.mod_id && inf.mod_id !== inf.user_id).forEach(inf => set.add(inf.mod_id));

        // For each found mod or mod in the specified list, populate the data array with values to send to the table
        const dataArray = [];
        const noCasesFoundForId = [];
        (allModsCheckbox.checked ? [...set] : modsList).forEach(mod => {

            // Determine the mod ID to use for this mod. mod variable is either a string or an object at this point
            const modId = (allModsCheckbox.checked || typeOfModFile === ModFileTypes.TYPE_ID_ARRAY) ? mod : mod.id;

            // Get all cases by mod
            const cases = caseData.cases.filter(inf => inf.mod_id === modId);

            // If this mod has no cases, return and add to array of failed IDs
            if (!cases.length) return noCasesFoundForId.push(modId);

            // Determine the mod name. If mode auto or if modsList is an array of strings, find the name through the cases, otherwise use the object mod.name
            const modName = (allModsCheckbox.checked || typeOfModFile === ModFileTypes.TYPE_ID_ARRAY) ? caseData.cases.find(inf => inf.mod_id === modId).mod_name : mod.name;

            const caseCounts = {
                BAN: `${cases.filter(inf => inf.type === ZeppelinCaseTypes.BAN).length} (${(cases.filter(inf => inf.type === ZeppelinCaseTypes.BAN).length / cases.length * 100).toFixed(1)}%)`,
                UNBAN: `${cases.filter(inf => inf.type === ZeppelinCaseTypes.UNBAN).length} (${(cases.filter(inf => inf.type === ZeppelinCaseTypes.UNBAN).length / cases.length * 100).toFixed(1)}%)`,
                NOTE: `${cases.filter(inf => inf.type === ZeppelinCaseTypes.NOTE).length} (${(cases.filter(inf => inf.type === ZeppelinCaseTypes.NOTE).length / cases.length * 100).toFixed(1)}%)`,
                WARNING: `${cases.filter(inf => inf.type === ZeppelinCaseTypes.WARNING).length} (${(cases.filter(inf => inf.type === ZeppelinCaseTypes.WARNING).length / cases.length * 100).toFixed(1)}%)`,
                KICK: `${cases.filter(inf => inf.type === ZeppelinCaseTypes.KICK).length} (${(cases.filter(inf => inf.type === ZeppelinCaseTypes.KICK).length / cases.length * 100).toFixed(1)}%)`,
                MUTE: `${cases.filter(inf => inf.type === ZeppelinCaseTypes.MUTE).length} (${(cases.filter(inf => inf.type === ZeppelinCaseTypes.MUTE).length / cases.length * 100).toFixed(1)}%)`,
                UNMUTE: `${cases.filter(inf => inf.type === ZeppelinCaseTypes.UNMUTE).length} (${(cases.filter(inf => inf.type === ZeppelinCaseTypes.UNMUTE).length / cases.length * 100).toFixed(1)}%)`
            };

            // Push the data to the array
            dataArray.push({ id: modId, name: modName, cases: `${cases.length} (${(cases.length / caseData.cases.length * 100).toFixed(1)}% of total)`, caseCounts });
        });

        // Alert if some IDs were not found in cases
        if (noCasesFoundForId.length) alert(`Found no cases for ${noCasesFoundForId.length} ${noCasesFoundForId.length === 1 ? "ID" : "IDs"}:\n\n${noCasesFoundForId.join(", ")}`);

        // Change visibility
        helpText.hidden = true;
        allModsCheckbox.hidden = true;
        allModsCheckboxText.hidden = true;
        caseUploadButton.hidden = true;
        resetButton.hidden = false;

        // Set the table data
        coolTable.setData(dataArray);
    }

    // Read file
    reader.readAsText(event.target.files[0]);

    // Clear input value to allow for more uploads
    caseUpload.value = null;
});


// Reset the page and clear the table
resetButton.addEventListener("click", () => {

    // Clear some variables
    modsList = null;
    typeOfModFile = null;

    // Set element visibility, and uncheck checkbox
    helpText.hidden = false;
    allModsCheckbox.hidden = false;
    allModsCheckbox.checked = false;
    allModsCheckboxText.hidden = false;
    modsUploadButton.hidden = false;
    caseUploadButton.hidden = true;
    resetButton.hidden = true;

    // Clear table
    coolTable.clearData();
});

// Download table data as JSON
downloadButtonJSON.addEventListener("click", () => {
    coolTable.download("json", `case_stats.json`);
});

// Download table data as CSV
downloadButtonCSV.addEventListener("click", () => {
    coolTable.download("csv", `case_stats.csv`);
});

// Download table data as HTML
downloadButtonHTML.addEventListener("click", () => {
    coolTable.download("html", `case_stats.html`, { style: true });
});

// Download table data as XLSX
downloadButtonXLSX.addEventListener("click", () => {
    coolTable.download("xlsx", `case_stats.xlsx`, { sheetName: "Case Stats" });
});

// Download table data as PDF
downloadButtonPDF.addEventListener("click", () => {
    coolTable.download("pdf", `case_stats.pdf`, { title: `Case Stats Report (${new Date().toUTCString()})` });
});