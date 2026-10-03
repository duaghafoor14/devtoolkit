console.log("ZIP.JS LOADED");
document.addEventListener("DOMContentLoaded", () => {
    const zipInput = document.getElementById("zip-input");
    const zipExample = document.getElementById("zip-example");
    const zipClear = document.getElementById("zip-clear");

    const zipError = document.getElementById("zip-error");
    const zipResults = document.getElementById("zip-results");

    const zipFileName = document.getElementById("zip-file-name");
    const zipFileCount = document.getElementById("zip-file-count");
    const zipFolderCount = document.getElementById("zip-folder-count");
    const zipArchiveSize = document.getElementById("zip-archive-size");

    const zipFileList = document.getElementById("zip-file-list");

    let currentZip = null;


    function showError(message) {
        zipError.textContent = message;
        zipError.hidden = false;
        zipResults.hidden = true;
    }


    function clearError() {
        zipError.textContent = "";
        zipError.hidden = true;
    }


    function formatBytes(bytes) {
        if (bytes === 0) {
            return "0 Bytes";
        }

        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB"
        ];

        const index = Math.floor(
            Math.log(bytes) / Math.log(1024)
        );

        const value =
            bytes / Math.pow(1024, index);

        return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
    }


    function escapeHTML(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getFileIcon(name) {
        const extension = name
            .split(".")
            .pop()
            .toLowerCase();

        const icons = {
            pdf: "📄",
            doc: "📝",
            docx: "📝",
            txt: "📃",
            csv: "📊",
            xls: "📊",
            xlsx: "📊",
            json: "🔧",
            js: "💻",
            html: "🌐",
            css: "🎨",
            png: "🖼️",
            jpg: "🖼️",
            jpeg: "🖼️",
            gif: "🖼️",
            svg: "🖼️",
            mp3: "🎵",
            mp4: "🎬",
            zip: "📦"
        };

        return icons[extension] || "📄";
    }


    function renderFiles(zip) {
        zipFileList.innerHTML = "";

        const entries = Object.values(zip.files);

        const folders = entries.filter(
            entry => entry.dir
        );

        const files = entries.filter(
            entry => !entry.dir
        );

        zipFileCount.textContent = files.length;
        zipFolderCount.textContent = folders.length;

        if (files.length === 0) {
            zipFileList.innerHTML = `
                <div class="zip-empty">
                    This ZIP archive does not contain any files.
                </div>
            `;

            return;
        }


        files.forEach((entry) => {

            const item = document.createElement("div");

            item.className = "zip-file-item";

            const path = entry.name;

            const fileName =
                path.split("/").pop() || path;

            const icon =
                getFileIcon(fileName);


            item.innerHTML = `
                <div class="zip-file-info">

                    <div class="zip-file-icon">
                        ${icon}
                    </div>

                    <div>
                        <div class="zip-file-name">
                            ${escapeHTML(fileName)}
                        </div>

                        <div class="zip-file-path">
                            ${escapeHTML(path)}
                        </div>

                        <div class="zip-file-size"
                            data-file-size>
                            Loading size...
                        </div>
                    </div>

                </div>

                <button
                    type="button"
                    class="button button-secondary zip-download-button">

                    Download

                </button>
            `;


            const downloadButton =
                item.querySelector(".zip-download-button");

            const sizeElement =
                item.querySelector("[data-file-size]");


            downloadButton.addEventListener(
                "click",
                async () => {

                    downloadButton.disabled = true;
                    downloadButton.textContent = "Preparing...";

                    try {

                        const blob =
                            await entry.async("blob");

                        const url =
                            URL.createObjectURL(blob);

                        const link =
                            document.createElement("a");

                        link.href = url;
                        link.download = fileName;

                        document.body.appendChild(link);

                        link.click();

                        link.remove();

                        URL.revokeObjectURL(url);

                    } catch (error) {

                        showError(
                            "Unable to extract this file."
                        );

                    } finally {

                        downloadButton.disabled = false;
                        downloadButton.textContent = "Download";

                    }

                }
            );


            entry.async("uint8array")
                .then(data => {

                    sizeElement.textContent =
                        formatBytes(data.length);

                })
                .catch(() => {

                    sizeElement.textContent =
                        "Size unavailable";

                });


            zipFileList.appendChild(item);

        });
    }


    async function openZip(file) {

        clearError();
        zipResults.hidden = true;

        if (!file) {
            return;
        }

        // Check file extension
        if (!file.name.toLowerCase().endsWith(".zip")) {
            showError("Please select a valid .zip file.");
            return;
        }

        // Check whether JSZip is available
        if (typeof JSZip === "undefined") {
            showError(
                "The ZIP library is not available. Please make sure jszip.min.js is loaded correctly."
            );
            return;
        }

        try {

            // Read the selected ZIP file
            const buffer = await file.arrayBuffer();

            // Load ZIP archive
            const zip = await JSZip.loadAsync(buffer);

            currentZip = zip;

            const entries = Object.values(zip.files);

            const folders = entries.filter(
                entry => entry.dir
            );

            const files = entries.filter(
                entry => !entry.dir
            );

            // Update summary
            zipFileName.textContent = file.name;

            zipArchiveSize.textContent =
                formatBytes(file.size);

            zipFileCount.textContent =
                files.length;

            zipFolderCount.textContent =
                folders.length;

            // Display files
            renderFiles(zip);

            // Show results
            zipResults.hidden = false;

            zipResults.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {

            console.error("ZIP ERROR:", error);

            showError(
                "The selected file could not be opened as a ZIP archive. Please make sure the file is a valid ZIP file."
            );
        }
    }


    zipInput.addEventListener(
        "change",
        () => {

            const file =
                zipInput.files[0];

            openZip(file);

        }
    );


    zipClear.addEventListener(
        "click",
        () => {

            zipInput.value = "";

            currentZip = null;

            zipResults.hidden = true;

            zipFileList.innerHTML = "";

            clearError();

        }
    );


    /*
     * Creates a small example ZIP in the browser
     * so the interface can be tested without
     * manually finding a ZIP file.
     */

    zipExample.addEventListener(
        "click",
        async () => {

            clearError();

            if (typeof JSZip === "undefined") {

                showError(
                    "The ZIP library could not be loaded."
                );

                return;
            }


            try {

                const exampleZip =
                    new JSZip();

                exampleZip.file(
                    "README.txt",
                    "Welcome to Dev Tool Kit!\n\nThis is an example ZIP archive."
                );

                exampleZip.file(
                    "documents/example.txt",
                    "This is an example text file."
                );

                exampleZip.file(
                    "data/example.json",
                    JSON.stringify(
                        {
                            name: "Dev Tool Kit",
                            type: "example",
                            browserBased: true
                        },
                        null,
                        2
                    )
                );


                const blob =
                    await exampleZip.generateAsync({
                        type: "blob"
                    });


                const exampleFile =
                    new File(
                        [blob],
                        "dev-tool-kit-example.zip",
                        {
                            type: "application/zip"
                        }
                    );


                await openZip(exampleFile);

            } catch (error) {

                console.error(error);

                showError(
                    "Unable to create the example ZIP."
                );

            }

        }
    );

});