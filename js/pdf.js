document.addEventListener("DOMContentLoaded", () => {

    const pdfInput = document.getElementById("pdf-input");
    const pdfExample = document.getElementById("pdf-example");
    const pdfClear = document.getElementById("pdf-clear");

    const pdfFileCard = document.getElementById("pdf-file-card");
    const pdfFileList = document.getElementById("pdf-file-list");
    const pdfFileCount = document.getElementById("pdf-file-count");

    const pdfOperationCard = document.getElementById("pdf-operation-card");
    const pdfMerge = document.getElementById("pdf-merge");
    const pdfSplit = document.getElementById("pdf-split");

    const pdfSplitControls = document.getElementById("pdf-split-controls");
    const pdfPageInput = document.getElementById("pdf-page-input");
    const pdfExtract = document.getElementById("pdf-extract");

    const pdfError = document.getElementById("pdf-error");

    const pdfResult = document.getElementById("pdf-result");
    const pdfResultTitle = document.getElementById("pdf-result-title");
    const pdfResultDescription = document.getElementById("pdf-result-description");
    const pdfResultPages = document.getElementById("pdf-result-pages");
    const pdfResultSize = document.getElementById("pdf-result-size");
    const pdfDownload = document.getElementById("pdf-download");

    let pdfFiles = [];
    let exampleFiles = [];


    /* -----------------------------------------------------
       Helpers
       ----------------------------------------------------- */

    function showError(message) {
        pdfError.textContent = message;
        pdfError.hidden = false;
    }

    function clearError() {
        pdfError.textContent = "";
        pdfError.hidden = true;
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

        const value = bytes / Math.pow(1024, index);

        return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
    }

    function isPdf(file) {
        return (
            file &&
            (
                file.type === "application/pdf" ||
                file.name.toLowerCase().endsWith(".pdf")
            )
        );
    }


    /* -----------------------------------------------------
       Check PDF-LIB
       ----------------------------------------------------- */

    function getPdfLib() {

        if (
            typeof PDFLib === "undefined" ||
            !PDFLib.PDFDocument
        ) {
            showError(
                "PDF library could not be loaded. Make sure pdf-lib.min.js is inside the js folder."
            );

            return null;
        }

        return PDFLib;
    }


    /* -----------------------------------------------------
       File Selection
       ----------------------------------------------------- */

    pdfInput.addEventListener("change", () => {

        clearError();

        const selectedFiles = Array.from(pdfInput.files || []);

        if (!selectedFiles.length) {
            return;
        }

        addFiles(selectedFiles);

        pdfInput.value = "";
    });


    function addFiles(files) {

        const invalidFiles = files.filter(file => !isPdf(file));

        if (invalidFiles.length) {
            showError("Only PDF files can be added.");
            return;
        }

        pdfFiles.push(...files);

        renderFileList();

        pdfFileCard.hidden = false;
        pdfOperationCard.hidden = false;
    }


    /* -----------------------------------------------------
       Render File List
       ----------------------------------------------------- */

    async function getPageCount(file) {

        try {

            const pdfLib = getPdfLib();

            if (!pdfLib) {
                return null;
            }

            const buffer = await file.arrayBuffer();

            const document = await pdfLib.PDFDocument.load(buffer, {
                ignoreEncryption: true
            });

            return document.getPageCount();

        } catch (error) {

            console.error("Could not read PDF:", error);

            return null;
        }
    }


    async function renderFileList() {

        pdfFileList.innerHTML = "";

        pdfFileCount.textContent =
            `${pdfFiles.length} ${pdfFiles.length === 1 ? "file" : "files"}`;

        pdfFiles.forEach((file, index) => {

            const item = document.createElement("div");
            item.className = "pdf-file-item";

            item.innerHTML = `
                <div class="pdf-file-icon">📄</div>

                <div class="pdf-file-info">
                    <div class="pdf-file-name" title="${escapeHTML(file.name)}">
                        ${escapeHTML(file.name)}
                    </div>

                    <div class="pdf-file-meta">
                        Reading pages...
                    </div>
                </div>

                <div class="pdf-file-controls">

                    <button
                        type="button"
                        class="pdf-file-control"
                        data-action="up"
                        data-index="${index}"
                        title="Move up"
                        ${index === 0 ? "disabled" : ""}>
                        ↑
                    </button>

                    <button
                        type="button"
                        class="pdf-file-control"
                        data-action="down"
                        data-index="${index}"
                        title="Move down"
                        ${index === pdfFiles.length - 1 ? "disabled" : ""}>
                        ↓
                    </button>

                    <button
                        type="button"
                        class="pdf-file-control"
                        data-action="remove"
                        data-index="${index}"
                        title="Remove">
                        ×
                    </button>

                </div>
            `;

            pdfFileList.appendChild(item);

            getPageCount(file).then(pageCount => {

                const meta = item.querySelector(".pdf-file-meta");

                if (pageCount === null) {
                    meta.textContent =
                        `${formatBytes(file.size)} • Unable to read`;
                } else {
                    meta.textContent =
                        `${pageCount} ${pageCount === 1 ? "page" : "pages"} • ${formatBytes(file.size)}`;
                }

            });

        });
    }


    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* -----------------------------------------------------
       File Controls
       ----------------------------------------------------- */

    pdfFileList.addEventListener("click", event => {

        const button = event.target.closest(".pdf-file-control");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const index = Number(button.dataset.index);

        if (action === "remove") {

            pdfFiles.splice(index, 1);

        } else if (action === "up" && index > 0) {

            [
                pdfFiles[index - 1],
                pdfFiles[index]
            ] = [
                    pdfFiles[index],
                    pdfFiles[index - 1]
                ];

        } else if (
            action === "down" &&
            index < pdfFiles.length - 1
        ) {

            [
                pdfFiles[index],
                pdfFiles[index + 1]
            ] = [
                    pdfFiles[index + 1],
                    pdfFiles[index]
                ];
        }

        renderFileList();

        if (!pdfFiles.length) {
            pdfFileCard.hidden = true;
            pdfOperationCard.hidden = true;
            pdfSplitControls.hidden = true;
        }
    });


    /* -----------------------------------------------------
       Merge PDFs
       ----------------------------------------------------- */

    pdfMerge.addEventListener("click", async () => {

        clearError();
        hideResult();

        if (pdfFiles.length < 2) {

            showError(
                "Please select at least two PDF files to merge."
            );

            return;
        }

        const pdfLib = getPdfLib();

        if (!pdfLib) {
            return;
        }

        try {

            pdfMerge.disabled = true;
            pdfSplit.disabled = true;

            const mergedPdf = await pdfLib.PDFDocument.create();

            let totalPages = 0;

            for (const file of pdfFiles) {

                const buffer = await file.arrayBuffer();

                const sourcePdf =
                    await pdfLib.PDFDocument.load(buffer, {
                        ignoreEncryption: true
                    });

                const pageCount = sourcePdf.getPageCount();

                const pages = await mergedPdf.copyPages(
                    sourcePdf,
                    sourcePdf.getPageIndices()
                );

                pages.forEach(page => {
                    mergedPdf.addPage(page);
                });

                totalPages += pageCount;
            }

            const outputBytes = await mergedPdf.save();

            const blob = new Blob(
                [outputBytes],
                { type: "application/pdf" }
            );

            showResult(
                "PDFs Merged Successfully",
                `Your ${pdfFiles.length} PDF files have been combined into one document.`,
                totalPages,
                blob,
                "merged.pdf"
            );

        } catch (error) {

            console.error("Merge error:", error);

            showError(
                "The PDFs could not be merged. One of the files may be damaged, encrypted, or unsupported."
            );

        } finally {

            pdfMerge.disabled = false;
            pdfSplit.disabled = false;
        }

    });


    /* -----------------------------------------------------
       Split / Extract UI
       ----------------------------------------------------- */

    pdfSplit.addEventListener("click", () => {

        clearError();

        if (!pdfFiles.length) {

            showError(
                "Please select a PDF file first."
            );

            return;
        }

        if (pdfFiles.length > 1) {

            showError(
                "For page extraction, please keep only one PDF in the list."
            );

            return;
        }

        pdfSplitControls.hidden = false;

        pdfPageInput.focus();
    });


    /* -----------------------------------------------------
       Extract Pages
       ----------------------------------------------------- */

    pdfExtract.addEventListener("click", async () => {

        clearError();
        hideResult();

        if (pdfFiles.length !== 1) {

            showError(
                "Please select exactly one PDF for page extraction."
            );

            return;
        }

        const pageText = pdfPageInput.value.trim();

        if (!pageText) {

            showError(
                "Enter the page numbers you want to extract."
            );

            return;
        }

        const pdfLib = getPdfLib();

        if (!pdfLib) {
            return;
        }

        try {

            pdfExtract.disabled = true;

            const file = pdfFiles[0];

            const buffer = await file.arrayBuffer();

            const sourcePdf =
                await pdfLib.PDFDocument.load(buffer, {
                    ignoreEncryption: true
                });

            const totalPages = sourcePdf.getPageCount();

            const pageNumbers =
                parsePageSelection(
                    pageText,
                    totalPages
                );

            if (!pageNumbers.length) {

                showError(
                    "No valid pages were found."
                );

                return;
            }

            const outputPdf =
                await pdfLib.PDFDocument.create();

            const pages = await outputPdf.copyPages(
                sourcePdf,
                pageNumbers.map(page => page - 1)
            );

            pages.forEach(page => {
                outputPdf.addPage(page);
            });

            const outputBytes =
                await outputPdf.save();

            const blob = new Blob(
                [outputBytes],
                { type: "application/pdf" }
            );

            showResult(
                "Pages Extracted Successfully",
                `Created a new PDF containing ${pageNumbers.length} selected ${pageNumbers.length === 1 ? "page" : "pages"}.`,
                pageNumbers.length,
                blob,
                "extracted-pages.pdf"
            );

        } catch (error) {

            console.error("Extract error:", error);

            showError(
                error.message ||
                "The selected pages could not be extracted."
            );

        } finally {

            pdfExtract.disabled = false;
        }

    });


    /* -----------------------------------------------------
       Parse Page Selection
       ----------------------------------------------------- */

    function parsePageSelection(value, totalPages) {

        const pages = new Set();

        const parts = value
            .split(",")
            .map(part => part.trim())
            .filter(Boolean);

        for (const part of parts) {

            if (part.includes("-")) {

                const range = part
                    .split("-")
                    .map(value => value.trim());

                if (range.length !== 2) {
                    continue;
                }

                const start = Number(range[0]);
                const end = Number(range[1]);

                if (
                    !Number.isInteger(start) ||
                    !Number.isInteger(end)
                ) {
                    continue;
                }

                if (
                    start < 1 ||
                    end < 1 ||
                    start > totalPages ||
                    end > totalPages ||
                    start > end
                ) {
                    continue;
                }

                for (let page = start; page <= end; page++) {
                    pages.add(page);
                }

            } else {

                const page = Number(part);

                if (
                    Number.isInteger(page) &&
                    page >= 1 &&
                    page <= totalPages
                ) {
                    pages.add(page);
                }
            }
        }

        return Array.from(pages).sort((a, b) => a - b);
    }


    /* -----------------------------------------------------
       Result
       ----------------------------------------------------- */

    function showResult(
        title,
        description,
        pages,
        blob,
        filename
    ) {

        if (pdfDownload.dataset.url) {

            URL.revokeObjectURL(
                pdfDownload.dataset.url
            );
        }

        const url = URL.createObjectURL(blob);

        pdfDownload.href = url;
        pdfDownload.download = filename;
        pdfDownload.dataset.url = url;

        pdfResultTitle.textContent = title;
        pdfResultDescription.textContent = description;
        pdfResultPages.textContent = pages;
        pdfResultSize.textContent = formatBytes(blob.size);

        pdfResult.hidden = false;

        pdfResult.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    function hideResult() {

        pdfResult.hidden = true;
    }


    /* -----------------------------------------------------
       Load Example
       ----------------------------------------------------- */

    pdfExample.addEventListener("click", async () => {

        clearError();
        hideResult();

        try {

            const pdfLib = getPdfLib();

            if (!pdfLib) {
                return;
            }

            pdfExample.disabled = true;

            const file1 =
                await createExamplePdf(
                    pdfLib,
                    "Example Document 1",
                    "This is the first example PDF."
                );

            const file2 =
                await createExamplePdf(
                    pdfLib,
                    "Example Document 2",
                    "This is the second example PDF."
                );

            exampleFiles = [file1, file2];

            pdfFiles = [...exampleFiles];

            renderFileList();

            pdfFileCard.hidden = false;
            pdfOperationCard.hidden = false;

        } catch (error) {

            console.error("Example error:", error);

            showError(
                "The example PDFs could not be created."
            );

        } finally {

            pdfExample.disabled = false;
        }

    });


    async function createExamplePdf(
        pdfLib,
        title,
        text
    ) {

        const pdfDoc =
            await pdfLib.PDFDocument.create();

        const page = pdfDoc.addPage([
            595.28,
            841.89
        ]);

        const {
            width,
            height
        } = page.getSize();

        page.drawText(title, {
            x: 60,
            y: height - 100,
            size: 24
        });

        page.drawText(text, {
            x: 60,
            y: height - 145,
            size: 14
        });

        page.drawText(
            "Created locally by Dev Tool Kit",
            {
                x: 60,
                y: 60,
                size: 10
            }
        );

        const bytes = await pdfDoc.save();

        return new File(
            [bytes],
            `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
            {
                type: "application/pdf"
            }
        );
    }


    /* -----------------------------------------------------
       Clear
       ----------------------------------------------------- */

    pdfClear.addEventListener("click", () => {

        clearError();

        pdfFiles = [];
        exampleFiles = [];

        pdfInput.value = "";
        pdfPageInput.value = "";

        pdfFileList.innerHTML = "";

        pdfFileCard.hidden = true;
        pdfOperationCard.hidden = true;
        pdfSplitControls.hidden = true;

        hideResult();

        if (pdfDownload.dataset.url) {

            URL.revokeObjectURL(
                pdfDownload.dataset.url
            );

            delete pdfDownload.dataset.url;
        }

    });


    /* -----------------------------------------------------
       Drag & Drop
       ----------------------------------------------------- */

    const dropZone =
        document.querySelector(".pdf-drop-zone");

    dropZone.addEventListener("dragover", event => {

        event.preventDefault();

        dropZone.style.borderColor =
            "var(--primary)";
    });

    dropZone.addEventListener("dragleave", () => {

        dropZone.style.borderColor =
            "var(--border)";
    });

    dropZone.addEventListener("drop", event => {

        event.preventDefault();

        dropZone.style.borderColor =
            "var(--border)";

        clearError();

        const files =
            Array.from(event.dataTransfer.files || []);

        if (files.length) {
            addFiles(files);
        }
    });


    /* -----------------------------------------------------
       Keyboard Shortcut
       ----------------------------------------------------- */

    pdfPageInput.addEventListener("keydown", event => {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {
            pdfExtract.click();
        }

    });

});