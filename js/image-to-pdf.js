document.addEventListener("DOMContentLoaded", () => {
    const imageInput = document.getElementById("image-input");
    const imageDropZone = document.querySelector(".image-drop-zone");

    const imageList = document.getElementById("image-list");
    const emptyState = document.getElementById("image-empty-state");

    const fileCount = document.getElementById("image-file-count");

    const exampleButton = document.getElementById("image-example");
    const clearButton = document.getElementById("image-clear");
    const generateButton = document.getElementById("image-generate");

    const errorBox = document.getElementById("image-error");

    const resultCard = document.getElementById("image-result");
    const resultDescription = document.getElementById("image-result-description");
    const resultCount = document.getElementById("image-result-count");
    const resultSize = document.getElementById("image-result-size");
    const downloadButton = document.getElementById("image-download");

    let images = [];
    let resultUrl = null;


    /* =========================================================
       Helpers
       ========================================================= */

    function showError(message) {
        errorBox.textContent = message;
        errorBox.classList.add("visible");
    }


    function clearError() {
        errorBox.textContent = "";
        errorBox.classList.remove("visible");
    }


    function formatBytes(bytes) {
        if (bytes === 0) return "0 Bytes";

        const units = ["Bytes", "KB", "MB", "GB"];
        const index = Math.floor(Math.log(bytes) / Math.log(1024));

        return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
    }


    function isSupportedImage(file) {
        return [
            "image/jpeg",
            "image/png",
            "image/webp"
        ].includes(file.type);
    }


    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getImageIcon(type) {
        if (type === "image/png") return "PNG";
        if (type === "image/webp") return "WEBP";
        return "JPG";
    }


    function updateFileCount() {
        const count = images.length;

        fileCount.textContent = `${count} ${count === 1 ? "image" : "images"}`;
    }


    function resetResult() {
        resultCard.classList.remove("visible");

        if (resultUrl) {
            URL.revokeObjectURL(resultUrl);
            resultUrl = null;
        }

        downloadButton.removeAttribute("href");
    }


    /* =========================================================
       Add Images
       ========================================================= */

    function addImages(files) {
        clearError();
        resetResult();

        const fileArray = Array.from(files);

        if (!fileArray.length) {
            return;
        }

        const invalidFiles = fileArray.filter(file => !isSupportedImage(file));

        if (invalidFiles.length) {
            showError(
                "Some files were skipped. Please select only JPG, PNG, or WebP images."
            );
        }

        const validFiles = fileArray.filter(file => isSupportedImage(file));

        validFiles.forEach(file => {
            const url = URL.createObjectURL(file);

            images.push({
                file,
                url
            });
        });

        renderImages();
    }


    /* =========================================================
       Render Image List
       ========================================================= */

    function renderImages() {
        imageList.innerHTML = "";

        updateFileCount();

        if (images.length === 0) {
            imageList.appendChild(emptyState);
            return;
        }

        images.forEach((image, index) => {

            const item = document.createElement("div");
            item.className = "image-item";

            item.innerHTML = `
                <div class="image-preview">
                    <img
                        src="${image.url}"
                        alt="${escapeHTML(image.file.name)}"
                    >
                </div>

                <div class="image-details">

                    <div class="image-number">
                        Page ${index + 1}
                    </div>

                    <strong class="image-name">
                        ${escapeHTML(image.file.name)}
                    </strong>

                    <span class="image-meta">
                        ${getImageIcon(image.file.type)}
                        ·
                        ${formatBytes(image.file.size)}
                    </span>

                </div>

                <div class="image-controls">

                    <button
                        type="button"
                        class="image-control"
                        data-action="up"
                        data-index="${index}"
                        aria-label="Move image up"
                        ${index === 0 ? "disabled" : ""}>
                        ↑
                    </button>

                    <button
                        type="button"
                        class="image-control"
                        data-action="down"
                        data-index="${index}"
                        aria-label="Move image down"
                        ${index === images.length - 1 ? "disabled" : ""}>
                        ↓
                    </button>

                    <button
                        type="button"
                        class="image-control remove"
                        data-action="remove"
                        data-index="${index}"
                        aria-label="Remove image">
                        ×
                    </button>

                </div>
            `;

            imageList.appendChild(item);
        });
    }


    /* =========================================================
       Image Controls
       ========================================================= */

    imageList.addEventListener("click", event => {

        const button = event.target.closest(".image-control");

        if (!button) {
            return;
        }

        const index = Number(button.dataset.index);
        const action = button.dataset.action;

        if (action === "up" && index > 0) {
            [images[index - 1], images[index]] =
                [images[index], images[index - 1]];
        }

        if (action === "down" && index < images.length - 1) {
            [images[index + 1], images[index]] =
                [images[index], images[index + 1]];
        }

        if (action === "remove") {
            URL.revokeObjectURL(images[index].url);
            images.splice(index, 1);
        }

        renderImages();
        resetResult();
    });


    /* =========================================================
       File Input
       ========================================================= */

    imageInput.addEventListener("change", event => {
        addImages(event.target.files);

        imageInput.value = "";
    });


    /* =========================================================
       Drag & Drop
       ========================================================= */

    ["dragenter", "dragover"].forEach(eventName => {
        imageDropZone.addEventListener(eventName, event => {
            event.preventDefault();
            imageDropZone.classList.add("dragging");
        });
    });


    ["dragleave", "drop"].forEach(eventName => {
        imageDropZone.addEventListener(eventName, event => {
            event.preventDefault();
            imageDropZone.classList.remove("dragging");
        });
    });


    imageDropZone.addEventListener("drop", event => {
        addImages(event.dataTransfer.files);
    });


    /* =========================================================
       Canvas Conversion
       ========================================================= */

    function loadImage(file) {
        return new Promise((resolve, reject) => {

            const img = new Image();

            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(`Could not read image: ${file.name}`));
            };

            img.src = url;
        });
    }


    async function convertImageToPng(file) {
        const img = await loadImage(file);

        const canvas = document.createElement("canvas");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const context = canvas.getContext("2d");

        context.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return new Promise((resolve, reject) => {

            canvas.toBlob(blob => {

                if (!blob) {
                    reject(new Error("Could not process image."));
                    return;
                }

                resolve(blob);

            }, "image/png");
        });
    }


    /* =========================================================
       Create PDF
       ========================================================= */

    async function createPDF() {

        clearError();
        resetResult();

        if (images.length === 0) {
            showError("Please add at least one image first.");
            return;
        }

        if (
            typeof PDFLib === "undefined" ||
            typeof PDFLib.PDFDocument === "undefined"
        ) {
            showError(
                "PDF library could not be loaded. Make sure pdf-lib.min.js is inside the js folder."
            );
            return;
        }

        generateButton.disabled = true;
        generateButton.textContent = "Creating PDF...";

        try {

            const { PDFDocument } = PDFLib;

            const pdfDoc = await PDFDocument.create();

            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;
            const MARGIN = 36;

            for (const image of images) {

                let embeddedImage;

                /*
                 * JPEG can be embedded directly.
                 * PNG and WebP are converted through canvas.
                 */
                if (image.file.type === "image/jpeg") {

                    const buffer = await image.file.arrayBuffer();

                    embeddedImage = await pdfDoc.embedJpg(buffer);

                } else {

                    const pngBlob = await convertImageToPng(image.file);
                    const pngBuffer = await pngBlob.arrayBuffer();

                    embeddedImage = await pdfDoc.embedPng(pngBuffer);
                }

                const imageWidth = embeddedImage.width;
                const imageHeight = embeddedImage.height;

                const imageIsLandscape = imageWidth > imageHeight;

                const pageWidth = imageIsLandscape
                    ? A4_HEIGHT
                    : A4_WIDTH;

                const pageHeight = imageIsLandscape
                    ? A4_WIDTH
                    : A4_HEIGHT;

                const page = pdfDoc.addPage([
                    pageWidth,
                    pageHeight
                ]);

                const maxWidth = pageWidth - (MARGIN * 2);
                const maxHeight = pageHeight - (MARGIN * 2);

                const widthRatio = maxWidth / imageWidth;
                const heightRatio = maxHeight / imageHeight;

                const scale = Math.min(
                    widthRatio,
                    heightRatio,
                    1
                );

                const drawWidth = imageWidth * scale;
                const drawHeight = imageHeight * scale;

                const x = (pageWidth - drawWidth) / 2;
                const y = (pageHeight - drawHeight) / 2;

                page.drawImage(embeddedImage, {
                    x,
                    y,
                    width: drawWidth,
                    height: drawHeight
                });
            }


            const pdfBytes = await pdfDoc.save();

            const blob = new Blob(
                [pdfBytes],
                { type: "application/pdf" }
            );

            resultUrl = URL.createObjectURL(blob);

            downloadButton.href = resultUrl;

            resultCount.textContent = images.length;
            resultSize.textContent = formatBytes(blob.size);

            resultDescription.textContent =
                `Your ${images.length === 1 ? "image has" : "images have"} been converted into a PDF successfully.`;

            resultCard.classList.add("visible");

            resultCard.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        } catch (error) {

            console.error(error);

            showError(
                error.message ||
                "Something went wrong while creating the PDF."
            );

        } finally {

            generateButton.disabled = false;
            generateButton.textContent = "Create PDF";
        }
    }


    /* =========================================================
       Load Example
       ========================================================= */

    async function createExampleImage(text, subtitle, filename) {

        const canvas = document.createElement("canvas");

        canvas.width = 1200;
        canvas.height = 800;

        const context = canvas.getContext("2d");

        context.fillStyle = "#eef5f0";
        context.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        context.fillStyle = "#2f7d55";
        context.fillRect(
            0,
            0,
            canvas.width,
            18
        );

        context.fillStyle = "#18231d";
        context.font = "bold 64px Arial";
        context.fillText(
            text,
            90,
            310
        );

        context.fillStyle = "#617066";
        context.font = "32px Arial";
        context.fillText(
            subtitle,
            90,
            370
        );

        context.fillStyle = "#2f7d55";
        context.font = "bold 28px Arial";
        context.fillText(
            "Dev Tool Kit",
            90,
            680
        );

        return new Promise(resolve => {

            canvas.toBlob(blob => {

                const file = new File(
                    [blob],
                    filename,
                    { type: "image/png" }
                );

                resolve(file);

            }, "image/png");
        });
    }


    async function loadExample() {

        clearError();
        resetResult();

        exampleButton.disabled = true;
        exampleButton.textContent = "Loading...";

        try {

            const first = await createExampleImage(
                "Example Image 1",
                "This is a sample image for the Image to PDF tool.",
                "example-image-1.png"
            );

            const second = await createExampleImage(
                "Example Image 2",
                "Add your own images and reorder them before creating the PDF.",
                "example-image-2.png"
            );

            addImages([first, second]);

        } catch (error) {

            showError("Could not load the example images.");

        } finally {

            exampleButton.disabled = false;
            exampleButton.textContent = "Load Example";
        }
    }


    /* =========================================================
       Clear All
       ========================================================= */

    function clearAll() {

        images.forEach(image => {
            URL.revokeObjectURL(image.url);
        });

        images = [];

        clearError();
        resetResult();
        renderImages();
    }


    /* =========================================================
       Buttons
       ========================================================= */

    exampleButton.addEventListener("click", loadExample);

    clearButton.addEventListener("click", clearAll);

    generateButton.addEventListener("click", createPDF);


    /* =========================================================
       Keyboard Shortcut
       ========================================================= */

    document.addEventListener("keydown", event => {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {
            event.preventDefault();
            createPDF();
        }
    });


    /* =========================================================
       Initial State
       ========================================================= */

    renderImages();
});