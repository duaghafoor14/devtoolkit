document.addEventListener("DOMContentLoaded", () => {
    const jwtInput = document.getElementById("jwt-input");
    const decodeButton = document.getElementById("decode-jwt");
    const clearButton = document.getElementById("clear-jwt");
    const exampleButton = document.getElementById("load-example");

    const errorBox = document.getElementById("jwt-error");
    const results = document.getElementById("jwt-results");

    const algorithm = document.getElementById("jwt-algorithm");
    const tokenType = document.getElementById("jwt-type");
    const claimCount = document.getElementById("jwt-claim-count");
    const expiration = document.getElementById("jwt-expiration");

    const headerOutput = document.getElementById("jwt-header-output");
    const payloadOutput = document.getElementById("jwt-payload-output");
    const signatureOutput = document.getElementById("jwt-signature-output");
    const claimsContainer = document.getElementById("jwt-claims");

    /*
     * --------------------------------------------------
     * Base64URL → UTF-8
     * --------------------------------------------------
     */
    function base64UrlDecode(value) {
        try {
            let base64 = value
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            while (base64.length % 4 !== 0) {
                base64 += "=";
            }

            const binary = atob(base64);

            const bytes = Uint8Array.from(
                binary,
                char => char.charCodeAt(0)
            );

            return new TextDecoder("utf-8").decode(bytes);

        } catch (error) {
            throw new Error("Invalid Base64URL encoding.");
        }
    }


    /*
     * --------------------------------------------------
     * Decode a JWT section
     * --------------------------------------------------
     */
    function decodeJSONPart(part, sectionName) {
        try {
            const decoded = base64UrlDecode(part);

            return JSON.parse(decoded);

        } catch (error) {
            throw new Error(
                `The JWT ${sectionName} section is not valid JSON.`
            );
        }
    }


    /*
     * --------------------------------------------------
     * Escape HTML
     * --------------------------------------------------
     */
    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /*
     * --------------------------------------------------
     * Format timestamp
     * --------------------------------------------------
     */
    function formatTimestamp(timestamp) {
        if (
            typeof timestamp !== "number" ||
            !Number.isFinite(timestamp)
        ) {
            return "Not provided";
        }

        const date = new Date(timestamp * 1000);

        if (Number.isNaN(date.getTime())) {
            return "Invalid date";
        }

        return date.toLocaleString();
    }


    /*
     * --------------------------------------------------
     * Expiration status
     * --------------------------------------------------
     */
    function getExpirationStatus(payload) {
        if (
            typeof payload.exp !== "number" ||
            !Number.isFinite(payload.exp)
        ) {
            return "Not provided";
        }

        const now = Math.floor(Date.now() / 1000);

        if (payload.exp < now) {
            return "Expired";
        }

        return "Not expired";
    }


    /*
     * --------------------------------------------------
     * Show error
     * --------------------------------------------------
     */
    function showError(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
        results.hidden = true;
    }


    /*
     * --------------------------------------------------
     * Hide error
     * --------------------------------------------------
     */
    function hideError() {
        errorBox.textContent = "";
        errorBox.hidden = true;
    }


    /*
     * --------------------------------------------------
     * Display claims
     * --------------------------------------------------
     */
    function displayClaims(payload) {
        claimsContainer.innerHTML = "";

        const commonClaims = [
            ["iss", "Issuer"],
            ["sub", "Subject"],
            ["aud", "Audience"],
            ["exp", "Expiration"],
            ["nbf", "Not Before"],
            ["iat", "Issued At"],
            ["jti", "JWT ID"]
        ];

        let displayed = 0;

        commonClaims.forEach(([key, label]) => {
            if (!(key in payload)) {
                return;
            }

            displayed++;

            let value = payload[key];

            if (
                ["exp", "nbf", "iat"].includes(key) &&
                typeof value === "number"
            ) {
                value = `${formatTimestamp(value)} (${value})`;
            }

            const item = document.createElement("div");
            item.className = "jwt-claim-item";

            item.innerHTML = `
                <div class="jwt-claim-name">
                    ${escapeHTML(label)}
                    <span>${escapeHTML(key)}</span>
                </div>

                <div class="jwt-claim-value">
                    ${escapeHTML(value)}
                </div>
            `;

            claimsContainer.appendChild(item);
        });


        /*
         * Display additional custom claims
         */
        Object.keys(payload).forEach(key => {
            if (commonClaims.some(([claimKey]) => claimKey === key)) {
                return;
            }

            displayed++;

            const value =
                typeof payload[key] === "object"
                    ? JSON.stringify(payload[key])
                    : payload[key];

            const item = document.createElement("div");
            item.className = "jwt-claim-item";

            item.innerHTML = `
                <div class="jwt-claim-name">
                    ${escapeHTML(key)}
                </div>

                <div class="jwt-claim-value">
                    ${escapeHTML(value)}
                </div>
            `;

            claimsContainer.appendChild(item);
        });


        if (displayed === 0) {
            claimsContainer.innerHTML = `
                <p class="jwt-empty-claims">
                    No claims found in this payload.
                </p>
            `;
        }
    }


    /*
     * --------------------------------------------------
     * Decode JWT
     * --------------------------------------------------
     */
    function decodeJWT() {
        hideError();

        const token = jwtInput.value.trim();

        if (!token) {
            showError("Please paste a JWT token first.");
            return;
        }


        const parts = token.split(".");

        if (parts.length !== 3) {
            showError(
                "Invalid JWT. A JWT must contain exactly three sections separated by dots."
            );
            return;
        }


        try {
            const header = decodeJSONPart(parts[0], "header");
            const payload = decodeJSONPart(parts[1], "payload");


            /*
             * Header
             */
            headerOutput.textContent =
                JSON.stringify(header, null, 2);


            /*
             * Payload
             */
            payloadOutput.textContent =
                JSON.stringify(payload, null, 2);


            /*
             * Signature
             */
            signatureOutput.textContent = parts[2];


            /*
             * Summary
             */
            algorithm.textContent =
                header.alg || "Not provided";

            tokenType.textContent =
                header.typ || "Not provided";

            claimCount.textContent =
                Object.keys(payload).length;

            expiration.textContent =
                getExpirationStatus(payload);


            /*
             * Claims
             */
            displayClaims(payload);


            /*
             * Show results
             */
            results.hidden = false;

            results.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {
            showError(
                error.message || "Unable to decode this JWT."
            );
        }
    }


    /*
     * --------------------------------------------------
     * Example JWT
     * --------------------------------------------------
     */
    const exampleJWT =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
        "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRldl" +
        "Rvb2wgS2l0IiwiaWF0IjoxNTE2MjM5MDIyfQ." +
        "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";


    /*
     * --------------------------------------------------
     * Load Example
     * --------------------------------------------------
     */
    exampleButton.addEventListener("click", () => {
        jwtInput.value = exampleJWT;

        hideError();
        results.hidden = true;

        jwtInput.focus();
    });


    /*
     * --------------------------------------------------
     * Decode button
     * --------------------------------------------------
     */
    decodeButton.addEventListener("click", decodeJWT);


    /*
     * --------------------------------------------------
     * Clear button
     * --------------------------------------------------
     */
    clearButton.addEventListener("click", () => {
        jwtInput.value = "";

        hideError();
        results.hidden = true;

        jwtInput.focus();
    });


    /*
     * --------------------------------------------------
     * Ctrl + Enter shortcut
     * --------------------------------------------------
     */
    jwtInput.addEventListener("keydown", event => {
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {
            event.preventDefault();
            decodeJWT();
        }
    });


    /*
     * --------------------------------------------------
     * Copy buttons
     * --------------------------------------------------
     */
    document.querySelectorAll(".jwt-copy-button").forEach(button => {

        button.addEventListener("click", async () => {

            const targetId =
                button.getAttribute("data-copy-target");

            const target =
                document.getElementById(targetId);

            if (!target) {
                return;
            }

            const text = target.textContent;

            try {

                await navigator.clipboard.writeText(text);

                const originalText = button.textContent;

                button.textContent = "Copied!";

                setTimeout(() => {
                    button.textContent = originalText;
                }, 1500);

            } catch (error) {

                /*
                 * Fallback for browsers where clipboard API
                 * is unavailable.
                 */
                const textarea =
                    document.createElement("textarea");

                textarea.value = text;

                document.body.appendChild(textarea);

                textarea.select();

                try {
                    document.execCommand("copy");
                    button.textContent = "Copied!";

                    setTimeout(() => {
                        button.textContent = "Copy";
                    }, 1500);

                } catch (copyError) {
                    button.textContent = "Copy failed";

                    setTimeout(() => {
                        button.textContent = "Copy";
                    }, 1500);
                }

                textarea.remove();
            }

        });

    });

});