const allModsCheckbox = document.getElementById("allModsCheckbox");
const allModsCheckboxText = document.getElementById("allModsCheckboxText");
const modsUploadButton = document.getElementById("modsUploadButton");
const caseUploadButton = document.getElementById("caseUploadButton");
const modsUpload = document.getElementById("modsUpload");
const caseUpload = document.getElementById("caseUpload");
const totalCasesButton = document.getElementById("totalCasesButton");
const casesSinceLaunchButton = document.getElementById("casesSinceLaunchButton");
const totalCasesAdminsButton = document.getElementById("totalCasesAdminsButton");
const casesSinceLaunchAdminsButton = document.getElementById("casesSinceLaunchAdminsButton");
const table = document.getElementById("caseTable");
const downloadButton = document.getElementById("downloadButton");

// Set Zeppelin case types
const CASE_TYPES = {
    BAN: 1,
    UNBAN: 2,
    NOTE: 3,
    WARNING: 4,
    KICK: 5,
    MUTE: 6,
    UNMUTE: 7,
    CASE_DELETED: 8,
    SOFT_BAN: 9
};

// Do not use pagination if the localStorage setting overrides it (is set to false)
const usePagination = !localStorage.getItem("usePagination") || localStorage.getItem("usePagination") === "true" ? true : false;

// Create the table
const coolTable = new Tabulator(table, {
    pagination: "local",
    paginationSize: 20,
    paginationCounter: "rows",
    placeholder: "Upload some data for me.",
    layout: "fitColumns",
    // footerElement: "<button class='button buttonBlue'>Custom Button</button>",

    columnDefaults: {
        headerTooltip: true,
        tooltip: cell => {
            return `${cell.getRow()._row.data.name} (${cell.getRow()._row.data.id}): ${cell.getColumn()._column.definition.title} - ${cell.getValue()}`;
        },
    },

    columns: [
        {
            title: "Basic Info",
            columns: [
                { title: "ID", field: "id", headerFilter: true, sorter: "number" },
                { title: "Name", field: "name", headerFilter: true }
            ]
        },
        {
            title: "Case Stats",
            columns: [
                { title: "Cases", field: "cases", sorter: "number" },
                { title: "Bans", field: "caseCounts.BAN", sorter: "number" },
                { title: "Unbans", field: "caseCounts.UNBAN", sorter: "number" },
                { title: "Notes", field: "caseCounts.NOTE", sorter: "number" },
                { title: "Warnings", field: "caseCounts.WARNING", sorter: "number" },
                { title: "Kicks", field: "caseCounts.KICK", sorter: "number" },
                { title: "Mutes", field: "caseCounts.MUTE", sorter: "number" },
                { title: "Unmutes", field: "caseCounts.UNMUTE", sorter: "number" }
            ]
        }
    ]
});

// Receive the mod list file
let modsList;
modsUpload.addEventListener("change", event => {
    const reader = new FileReader();
    reader.readAsText(event.target.files[0]);

    reader.onload = event => {
        const modArray = JSON.parse(event.target.result);
        modsList = modArray;

        // If data received is not an array or the first index does not comply, return an alert
        if (!Array.isArray(modsList) || !modsList[0].id || !modsList[0].name) {
            return alert('This file needs to be an array with the correct JSON structure. Example:\n\n[\n  { "id": "MOD_ID1", "name": "MOD_NAME1" },\n  { "id": "MOD_ID2", "name": "MOD_NAME2" }\n]');
        } else {
            // Change visibility
            allModsCheckbox.hidden = true;
            allModsCheckboxText.hidden = true;
            caseUploadButton.hidden = false;
            modsUploadButton.hidden = true;
        }
    }
});

// Receive the case export file
caseUpload.addEventListener("change", event => {

    const reader = new FileReader();
    reader.readAsText(event.target.files[0]);
    reader.onload = event => {

        const caseData = JSON.parse(event.target.result);

        // Create a set and add each mod_id (where mod_id is not "0", where it exists, and where it doesn't equal user_id (automod))
        const set = new Set();
        caseData.cases.filter(inf => inf.mod_id !== "0" && inf.mod_id && inf.mod_id !== inf.user_id).forEach(inf => set.add(inf.mod_id));

        // For each found mod or mod in the specified list, populate the data array with values to send to the table
        const dataArray = [];
        (allModsCheckbox.checked ? [...set] : modsList).forEach(mod => {
            const cases = caseData.cases.filter(inf => (allModsCheckbox.checked ? mod : mod.id) === inf.mod_id);
            const modName = cases.find(inf => (allModsCheckbox.checked ? mod : mod.id) === inf.mod_id).mod_name;
            const caseCounts = {
                BAN: `${cases.filter(inf => inf.type === CASE_TYPES.BAN).length} (${(cases.filter(inf => inf.type === CASE_TYPES.BAN).length / cases.length * 100).toFixed(1)}%)`,
                UNBAN: `${cases.filter(inf => inf.type === CASE_TYPES.UNBAN).length} (${(cases.filter(inf => inf.type === CASE_TYPES.UNBAN).length / cases.length * 100).toFixed(1)}%)`,
                NOTE: `${cases.filter(inf => inf.type === CASE_TYPES.NOTE).length} (${(cases.filter(inf => inf.type === CASE_TYPES.NOTE).length / cases.length * 100).toFixed(1)}%)`,
                WARNING: `${cases.filter(inf => inf.type === CASE_TYPES.WARNING).length} (${(cases.filter(inf => inf.type === CASE_TYPES.WARNING).length / cases.length * 100).toFixed(1)}%)`,
                KICK: `${cases.filter(inf => inf.type === CASE_TYPES.KICK).length} (${(cases.filter(inf => inf.type === CASE_TYPES.KICK).length / cases.length * 100).toFixed(1)}%)`,
                MUTE: `${cases.filter(inf => inf.type === CASE_TYPES.MUTE).length} (${(cases.filter(inf => inf.type === CASE_TYPES.MUTE).length / cases.length * 100).toFixed(1)}%)`,
                UNMUTE: `${cases.filter(inf => inf.type === CASE_TYPES.UNMUTE).length} (${(cases.filter(inf => inf.type === CASE_TYPES.UNMUTE).length / cases.length * 100).toFixed(1)}%)`,
            }

            // Push the data to the array
            dataArray.push({ id: (allModsCheckbox.checked ? mod : mod.id), name: (allModsCheckbox.checked ? modName : mod.name), cases: `${cases.length} (${(cases.length / caseData.cases.length * 100).toFixed(1)}% of total)`, caseCounts });
        });

        // Set the table data
        coolTable.setData(dataArray);
    }

    // Change visibility
    allModsCheckbox.hidden = true;
    allModsCheckboxText.hidden = true;
    caseUploadButton.hidden = true;
});


// Download table data as JSON
downloadButton.addEventListener("click", () => {
    coolTable.download("json", `mod_data_${new Date().toUTCString()}.json`);
});