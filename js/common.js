/* =========================================================
   Dev Tool Kit - Common JavaScript
   Shared functionality used across the website
   ========================================================= */

(function () {
    "use strict";

    /* =======================================================
       Theme
       ======================================================= */

    const THEME_KEY = "dev-tool-kit-theme";

    function getPreferredTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);

        if (savedTheme === "light" || savedTheme === "dark") {
            return savedTheme;
        }

        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);

        const themeButtons = document.querySelectorAll("[data-theme-toggle]");

        themeButtons.forEach((button) => {
            const isDark = theme === "dark";

            button.setAttribute(
                "aria-label",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );

            button.setAttribute("title", isDark ? "Light mode" : "Dark mode");

            const icon = button.querySelector("[data-theme-icon]");

            if (icon) {
                icon.textContent = isDark ? "☀" : "☾";
            }
        });
    }

    function toggleTheme() {
        const currentTheme =
            document.documentElement.getAttribute("data-theme") ||
            getPreferredTheme();

        const newTheme = currentTheme === "dark" ? "light" : "dark";

        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
    }

    function initializeTheme() {
        applyTheme(getPreferredTheme());

        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            button.addEventListener("click", toggleTheme);
        });
    }

    /* =======================================================
       Mobile Navigation
       ======================================================= */

    function initializeMobileNavigation() {
        const menuButton = document.querySelector("[data-menu-toggle]");
        const mobileNav = document.querySelector("[data-mobile-nav]");

        if (!menuButton || !mobileNav) {
            return;
        }

        menuButton.addEventListener("click", () => {
            const isOpen = mobileNav.classList.toggle("open");

            menuButton.setAttribute("aria-expanded", String(isOpen));

            const icon = menuButton.querySelector("[data-menu-icon]");

            if (icon) {
                icon.textContent = isOpen ? "✕" : "☰";
            }
        });

        mobileNav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                mobileNav.classList.remove("open");
                menuButton.setAttribute("aria-expanded", "false");

                const icon = menuButton.querySelector("[data-menu-icon]");

                if (icon) {
                    icon.textContent = "☰";
                }
            });
        });
    }

    /* =======================================================
       Toast Notifications
       ======================================================= */

    function showToast(message, type = "default", duration = 3000) {
        let container = document.querySelector(".toast-container");

        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            container.setAttribute("aria-live", "polite");
            container.setAttribute("aria-atomic", "true");
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");

        if (type === "success") {
            toast.setAttribute("data-type", "success");
        } else if (type === "error") {
            toast.setAttribute("data-type", "error");
        } else if (type === "warning") {
            toast.setAttribute("data-type", "warning");
        }

        toast.textContent = message;

        container.appendChild(toast);

        window.setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(8px)";

            window.setTimeout(() => {
                toast.remove();
            }, 200);
        }, duration);
    }

    /* =======================================================
       Clipboard
       ======================================================= */

    async function copyToClipboard(text) {
        if (!text) {
            showToast("There is nothing to copy.", "warning");
            return false;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                showToast("Copied to clipboard.", "success");
                return true;
            }

            const textArea = document.createElement("textarea");

            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";

            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            const successful = document.execCommand("copy");

            textArea.remove();

            if (successful) {
                showToast("Copied to clipboard.", "success");
                return true;
            }

            throw new Error("Copy command failed.");
        } catch (error) {
            console.error("Clipboard error:", error);
            showToast("Could not copy the text.", "error");
            return false;
        }
    }

    /* =======================================================
       Download Helpers
       ======================================================= */

    function downloadBlob(blob, filename) {
        if (!(blob instanceof Blob)) {
            console.error("downloadBlob requires a Blob.");
            return;
        }

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = filename || "download";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    function downloadText(text, filename, mimeType = "text/plain;charset=utf-8") {
        const blob = new Blob([text], {
            type: mimeType,
        });

        downloadBlob(blob, filename);
    }

    /* =======================================================
       File Size Formatting
       ======================================================= */

    function formatFileSize(bytes) {
        if (!Number.isFinite(bytes) || bytes < 0) {
            return "0 B";
        }

        if (bytes === 0) {
            return "0 B";
        }

        const units = ["B", "KB", "MB", "GB", "TB"];

        const exponent = Math.min(
            Math.floor(Math.log(bytes) / Math.log(1024)),
            units.length - 1
        );

        const value = bytes / Math.pow(1024, exponent);

        const decimals = exponent === 0 ? 0 : value < 10 ? 2 : 1;

        return `${value.toFixed(decimals)} ${units[exponent]}`;
    }

    /* =======================================================
       Date Formatting
       ======================================================= */

    function formatDate(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        return new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    }

    /* =======================================================
       Debounce
       ======================================================= */

    function debounce(callback, delay = 300) {
        let timeoutId;

        return function (...args) {
            window.clearTimeout(timeoutId);

            timeoutId = window.setTimeout(() => {
                callback.apply(this, args);
            }, delay);
        };
    }

    /* =======================================================
       File Drop Zone
       ======================================================= */

    function initializeDropZone(dropZone, fileInput, options = {}) {
        if (!dropZone || !fileInput) {
            return;
        }

        const {
            multiple = false,
            accept = null,
            onFiles = null,
        } = options;

        function processFiles(fileList) {
            const files = Array.from(fileList || []);

            if (!files.length) {
                return;
            }

            let selectedFiles = files;

            if (!multiple) {
                selectedFiles = files.slice(0, 1);
            }

            if (accept) {
                const acceptedExtensions = accept
                    .split(",")
                    .map((item) => item.trim().toLowerCase())
                    .filter(Boolean);

                selectedFiles = selectedFiles.filter((file) => {
                    const filename = file.name.toLowerCase();

                    return acceptedExtensions.some((rule) => {
                        if (rule.startsWith(".")) {
                            return filename.endsWith(rule);
                        }

                        if (rule.endsWith("/*")) {
                            return file.type.startsWith(rule.slice(0, -1));
                        }

                        return file.type === rule;
                    });
                });
            }

            if (!selectedFiles.length) {
                showToast("No supported files were selected.", "warning");
                return;
            }

            if (typeof onFiles === "function") {
                onFiles(selectedFiles);
            }
        }

        dropZone.addEventListener("click", () => {
            fileInput.click();
        });

        dropZone.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInput.click();
            }
        });

        fileInput.addEventListener("change", () => {
            processFiles(fileInput.files);
        });

        ["dragenter", "dragover"].forEach((eventName) => {
            dropZone.addEventListener(eventName, (event) => {
                event.preventDefault();
                event.stopPropagation();

                dropZone.classList.add("dragover");
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            dropZone.addEventListener(eventName, (event) => {
                event.preventDefault();
                event.stopPropagation();

                dropZone.classList.remove("dragover");
            });
        });

        dropZone.addEventListener("drop", (event) => {
            processFiles(event.dataTransfer.files);
        });
    }

    /* =======================================================
       HTML Escaping
       ======================================================= */

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =======================================================
       Current Year
       ======================================================= */

    function initializeCurrentYear() {
        const year = new Date().getFullYear();

        document.querySelectorAll("[data-current-year]").forEach((element) => {
            element.textContent = year;
        });
    }

    /* =======================================================
       Initialize
       ======================================================= */

    function initialize() {
        initializeTheme();
        initializeMobileNavigation();
        initializeCurrentYear();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }

    /* =======================================================
       Public Utilities
       ======================================================= */

    window.SiteUtils = {
        showToast,
        copyToClipboard,
        downloadBlob,
        downloadText,
        formatFileSize,
        formatDate,
        debounce,
        initializeDropZone,
        escapeHtml,
    };
})();