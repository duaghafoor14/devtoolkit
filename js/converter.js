/* =========================================================
   DEV TOOL KIT — JSON / YAML / CSV CONVERTER
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const fromFormat = document.getElementById("fromFormat");
    const toFormat = document.getElementById("toFormat");
    const inputData = document.getElementById("inputData");
    const outputData = document.getElementById("outputData");

    const convertBtn = document.getElementById("convertBtn");
    const formatJsonBtn = document.getElementById("formatJsonBtn");
    const minifyJsonBtn = document.getElementById("minifyJsonBtn");
    const validateJsonBtn = document.getElementById("validateJsonBtn");

    const swapFormatsBtn = document.getElementById("swapFormats");
    const loadSampleBtn = document.getElementById("loadSample");
    const copyOutputBtn = document.getElementById("copyOutput");
    const downloadBtn = document.getElementById("downloadBtn");
    const clearBtn = document.getElementById("clearBtn");

    const statusMessage = document.getElementById("statusMessage");

    /* ---------------------------------------------------------
       Check required elements
       --------------------------------------------------------- */

    if (
        !fromFormat ||
        !toFormat ||
        !inputData ||
        !outputData ||
        !convertBtn
    ) {
        console.error("Converter: Required HTML elements were not found.");
        return;
    }

    /* ---------------------------------------------------------
       Sample data
       --------------------------------------------------------- */

    const sampleJSON = `{
  "product": "Laptop",
  "category": "Electronics",
  "price": 899,
  "inStock": true,
  "features": [
    "16GB RAM",
    "512GB SSD",
    "Backlit Keyboard"
  ]
}`;

    const sampleYAML = `product: Laptop
category: Electronics
price: 899
inStock: true
features:
  - 16GB RAM
  - 512GB SSD
  - Backlit Keyboard`;

    const sampleCSV = `product,category,price,inStock
Laptop,Electronics,899,true
Keyboard,Accessories,49,true
Monitor,Electronics,249,false`;

    /* ---------------------------------------------------------
       Status message
       --------------------------------------------------------- */

    function showStatus(message, type = "info") {
        if (!statusMessage) return;

        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;

        clearTimeout(showStatus.timeout);

        showStatus.timeout = setTimeout(() => {
            statusMessage.textContent = "";
            statusMessage.className = "status-message";
        }, 5000);
    }

    /* ---------------------------------------------------------
       Parse JSON
       --------------------------------------------------------- */

    function parseJSON(text) {
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(`Invalid JSON: ${error.message}`);
        }
    }

    /* ---------------------------------------------------------
       Parse YAML
       --------------------------------------------------------- */

    function parseYAML(text) {
        if (typeof jsyaml === "undefined") {
            throw new Error(
                "YAML library is not loaded. Please refresh the page and try again."
            );
        }

        try {
            return jsyaml.load(text);
        } catch (error) {
            throw new Error(`Invalid YAML: ${error.message}`);
        }
    }

    /* ---------------------------------------------------------
       Parse CSV
       --------------------------------------------------------- */

    function parseCSV(text) {
        if (typeof Papa === "undefined") {
            throw new Error(
                "CSV library is not loaded. Please refresh the page and try again."
            );
        }

        try {
            const result = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true
            });

            if (result.errors && result.errors.length > 0) {
                const firstError = result.errors[0];

                throw new Error(
                    `${firstError.message || "Invalid CSV"}${firstError.row !== undefined
                        ? ` at row ${firstError.row + 1}`
                        : ""
                    }`
                );
            }

            return result.data;
        } catch (error) {
            throw new Error(`Invalid CSV: ${error.message}`);
        }
    }

    /* ---------------------------------------------------------
       Parse input according to selected format
       --------------------------------------------------------- */

    function parseInput(text, format) {
        const cleanedText = text.trim();

        if (!cleanedText) {
            throw new Error("Please enter some data first.");
        }

        switch (format) {
            case "json":
                return parseJSON(cleanedText);

            case "yaml":
                return parseYAML(cleanedText);

            case "csv":
                return parseCSV(cleanedText);

            default:
                throw new Error(`Unsupported input format: ${format}`);
        }
    }

    /* ---------------------------------------------------------
       Convert value to JSON
       --------------------------------------------------------- */
    function convertToJSON(data, indent = "2") {
        let spacing = 2;

        if (indent === "4") {
            spacing = 4;
        } else if (indent === "tab") {
            spacing = "\t";
        }

        return JSON.stringify(data, null, spacing);
    }

    /* ---------------------------------------------------------
       Convert value to YAML
       --------------------------------------------------------- */

    function convertToYAML(data) {
        if (typeof jsyaml === "undefined") {
            throw new Error(
                "YAML library is not loaded. Please refresh the page."
            );
        }

        return jsyaml.dump(data, {
            indent: 2,
            noRefs: true,
            lineWidth: -1
        });
    }

    /* ---------------------------------------------------------
       Flatten nested JSON for CSV
       --------------------------------------------------------- */

    function flattenObject(object, prefix = "", result = {}) {
        Object.entries(object).forEach(([key, value]) => {
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (
                value !== null &&
                typeof value === "object" &&
                !Array.isArray(value)
            ) {
                flattenObject(value, newKey, result);
            } else if (Array.isArray(value)) {
                result[newKey] = value.join(", ");
            } else {
                result[newKey] = value;
            }
        });

        return result;
    }

    /* ---------------------------------------------------------
       Convert JSON data to CSV
       --------------------------------------------------------- */

    function convertToCSV(data) {
        if (typeof Papa === "undefined") {
            throw new Error(
                "CSV library is not loaded. Please refresh the page."
            );
        }

        let rows;

        if (Array.isArray(data)) {
            if (data.length === 0) {
                return "";
            }

            rows = data.map((item) => {
                if (
                    item !== null &&
                    typeof item === "object" &&
                    !Array.isArray(item)
                ) {
                    return flattenObject(item);
                }

                return { value: item };
            });
        } else if (
            data !== null &&
            typeof data === "object"
        ) {
            rows = [flattenObject(data)];
        } else {
            rows = [{ value: data }];
        }

        return Papa.unparse(rows, {
            header: true
        });
    }

    /* ---------------------------------------------------------
       Convert any supported format to another format
       --------------------------------------------------------- */

    function convertData() {
        try {
            const sourceFormat = fromFormat.value;
            const targetFormat = toFormat.value;

            const parsedData = parseInput(
                inputData.value,
                sourceFormat
            );

            let result = "";

            if (targetFormat === "json") {
                const indent =
                    document.getElementById("jsonIndent")?.value || "2";

                result = convertToJSON(parsedData, indent);
            } else if (targetFormat === "yaml") {
                result = convertToYAML(parsedData);
            } else if (targetFormat === "csv") {
                result = convertToCSV(parsedData);
            } else {
                throw new Error("Unsupported output format.");
            }

            outputData.value = result;

            showStatus(
                `Successfully converted ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()}.`,
                "success"
            );
        } catch (error) {
            outputData.value = "";

            showStatus(
                error.message || "Conversion failed.",
                "error"
            );

            console.error("Converter error:", error);
        }
    }

    /* ---------------------------------------------------------
       Load sample
       --------------------------------------------------------- */

    function loadSample() {
        const format = fromFormat.value;

        if (format === "json") {
            inputData.value = sampleJSON;
        } else if (format === "yaml") {
            inputData.value = sampleYAML;
        } else if (format === "csv") {
            inputData.value = sampleCSV;
        }

        outputData.value = "";

        showStatus(
            `Sample ${format.toUpperCase()} data loaded.`,
            "success"
        );
    }

    /* ---------------------------------------------------------
       Swap formats
       --------------------------------------------------------- */

    function swapFormats() {
        const oldFrom = fromFormat.value;
        const oldTo = toFormat.value;

        fromFormat.value = oldTo;
        toFormat.value = oldFrom;

        if (outputData.value.trim()) {
            inputData.value = outputData.value;
            outputData.value = "";
        }

        updateJSONOptions();

        showStatus(
            `Formats swapped: ${fromFormat.value.toUpperCase()} → ${toFormat.value.toUpperCase()}.`,
            "info"
        );
    }

    /* ---------------------------------------------------------
       Format JSON
       --------------------------------------------------------- */

    function formatJSON() {
        try {
            const data = parseJSON(inputData.value);

            const indent =
                document.getElementById("jsonIndent")?.value || "2";

            inputData.value = convertToJSON(data, indent);

            showStatus(
                "JSON formatted successfully.",
                "success"
            );
        } catch (error) {
            showStatus(error.message, "error");
        }
    }

    /* ---------------------------------------------------------
       Minify JSON
       --------------------------------------------------------- */

    function minifyJSON() {
        try {
            const data = parseJSON(inputData.value);

            inputData.value = JSON.stringify(data);

            showStatus(
                "JSON minified successfully.",
                "success"
            );
        } catch (error) {
            showStatus(error.message, "error");
        }
    }

    /* ---------------------------------------------------------
       Validate JSON
       --------------------------------------------------------- */

    function validateJSON() {
        try {
            parseJSON(inputData.value);

            showStatus(
                "✓ Valid JSON. No syntax errors found.",
                "success"
            );
        } catch (error) {
            showStatus(
                `✕ ${error.message}`,
                "error"
            );
        }
    }

    /* ---------------------------------------------------------
       Copy output
       --------------------------------------------------------- */

    async function copyOutput() {
        const text = outputData.value;

        if (!text.trim()) {
            showStatus(
                "There is no output to copy.",
                "error"
            );
            return;
        }

        try {
            if (
                window.SiteUtils &&
                typeof window.SiteUtils.copyToClipboard === "function"
            ) {
                await window.SiteUtils.copyToClipboard(text);
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                const temporaryTextarea =
                    document.createElement("textarea");

                temporaryTextarea.value = text;
                document.body.appendChild(temporaryTextarea);
                temporaryTextarea.select();

                document.execCommand("copy");
                temporaryTextarea.remove();
            }

            showStatus(
                "Output copied to clipboard.",
                "success"
            );
        } catch (error) {
            showStatus(
                "Could not copy the output.",
                "error"
            );
        }
    }

    /* ---------------------------------------------------------
       Download output
       --------------------------------------------------------- */

    function downloadOutput() {
        const text = outputData.value;

        if (!text.trim()) {
            showStatus(
                "There is no output to download.",
                "error"
            );
            return;
        }

        const format = toFormat.value;

        let extension = format;

        if (format === "json") {
            extension = "json";
        } else if (format === "yaml") {
            extension = "yaml";
        } else if (format === "csv") {
            extension = "csv";
        }

        const blob = new Blob(
            [text],
            {
                type:
                    format === "json"
                        ? "application/json"
                        : format === "csv"
                            ? "text/csv"
                            : "text/yaml"
            }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `converted-data.${extension}`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        showStatus(
            `Downloaded as ${extension.toUpperCase()}.`,
            "success"
        );
    }

    /* ---------------------------------------------------------
       Clear
       --------------------------------------------------------- */

    function clearAll() {
        inputData.value = "";
        outputData.value = "";

        showStatus(
            "Converter cleared.",
            "info"
        );
    }

    /* ---------------------------------------------------------
       JSON options visibility
       --------------------------------------------------------- */

    function updateJSONOptions() {
        const jsonOptions = document.getElementById("jsonOptions");

        if (!jsonOptions) return;

        if (
            fromFormat.value === "json" ||
            toFormat.value === "json"
        ) {
            jsonOptions.style.display = "";
        } else {
            jsonOptions.style.display = "none";
        }
    }

    /* ---------------------------------------------------------
       Live conversion
       --------------------------------------------------------- */

    let liveTimer = null;

    function liveConvert() {
        clearTimeout(liveTimer);

        liveTimer = setTimeout(() => {
            if (!inputData.value.trim()) {
                outputData.value = "";
                return;
            }

            convertData();
        }, 300);
    }

    /* ---------------------------------------------------------
       Event listeners
       --------------------------------------------------------- */

    convertBtn.addEventListener("click", convertData);

    if (loadSampleBtn) {
        loadSampleBtn.addEventListener("click", loadSample);
    }

    if (swapFormatsBtn) {
        swapFormatsBtn.addEventListener("click", swapFormats);
    }

    if (copyOutputBtn) {
        copyOutputBtn.addEventListener("click", copyOutput);
    }

    if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadOutput);
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", clearAll);
    }

    if (formatJsonBtn) {
        formatJsonBtn.addEventListener("click", formatJSON);
    }

    if (minifyJsonBtn) {
        minifyJsonBtn.addEventListener("click", minifyJSON);
    }

    if (validateJsonBtn) {
        validateJsonBtn.addEventListener("click", validateJSON);
    }

    inputData.addEventListener("input", liveConvert);

    fromFormat.addEventListener("change", () => {
        updateJSONOptions();
        outputData.value = "";
    });

    toFormat.addEventListener("change", () => {
        updateJSONOptions();
        outputData.value = "";
    });

    /* ---------------------------------------------------------
       Initial setup
       --------------------------------------------------------- */

    updateJSONOptions();

    console.log("Dev Tool Kit Converter loaded successfully.");
});