const table = document.getElementById("caseTableHelp");

const calcSumNumbers = () => {
    return "SUM OF BELOW";
}

const calcSumMods = () => {
    return "X MODERATORS";
}

// Create the table
const coolTable = new Tabulator(table, {
    pagination: "local",
    paginationSize: 20,
    paginationCounter: "rows",
    placeholder: "Upload some data for me.",
    layout: "fitDataStretch", // This fills the width and creates a scrollbar before it gets mushy

    columnDefaults: {
        headerTooltip: true,
        tooltip: cell => {
            // If the cell is missing this value, it's probably a sum cell, so return
            if (!cell.getColumn()._column.definition.title) return;
            return `${cell.getRow()._row.data.name} (${cell.getRow()._row.data.id}): ${cell.getColumn()._column.definition.title} - ${cell.getValue()}`;
        }
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
                { title: "Unmutes", field: "caseCounts.UNMUTE", sorter: "number", topCalc: calcSumNumbers },
                { title: "Softbans", field: "caseCounts.SOFTBAN", sorter: "number", topCalc: calcSumNumbers },
                { title: "Unknown", field: "caseCounts.UNKNOWN", sorter: "number", topCalc: calcSumNumbers }
            ]
        }
    ],
    data: [
        {
            id: "EXAMPLE_MOD_ID", name: "EXAMPLE_MOD_NAME", cases: "CASES (X% OF SUM TOTAL)", caseCounts: { BAN: "BANS (X% OF MOD)", UNBAN: "UNBANS (X% OF MOD)", NOTE: "NOTES (X% OF MOD)", WARNING: "WARNINGS (X% OF MOD)", KICK: "KICKS (X% OF MOD)", MUTE: "MUTES (X% OF MOD)", UNMUTE: "UNMUTES (X% OF MOD)", SOFTBAN: "SOFTBANS (X% OF MOD)", UNKNOWN: "UNKNOWN (X% OF MOD)" }
        },
        {
            id: "99182302885588992", name: "Mozzy#9999", cases: "6097 (100% of total)", caseCounts: { BAN: "5590 (91.7%)", UNBAN: "47 (0.8%)", NOTE: "25 (0.4%)", WARNING: "128 (2.1%)", KICK: "19 (0.3%)", MUTE: "212 (3.5%)", UNMUTE: "76 (1.2%)", SOFTBAN: "0 (0.0%)", UNKNOWN: "0 (0.0%)" }
        }
    ]
});