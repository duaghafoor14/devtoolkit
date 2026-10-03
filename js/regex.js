document.addEventListener("DOMContentLoaded", () => {

    const patternInput = document.getElementById("regex-pattern");
    const testTextInput = document.getElementById("regex-test-text");

    const testButton = document.getElementById("regex-test");
    const clearButton = document.getElementById("regex-clear");
    const exampleButton = document.getElementById("regex-example");

    const errorBox = document.getElementById("regex-error");
    const results = document.getElementById("regex-results");

    const matchCount = document.getElementById("regex-match-count");
    const highlightBox = document.getElementById("regex-highlight");
    const matchDetails = document.getElementById("regex-match-details");


    /*
     * --------------------------------------------------
     * Get selected regex flags
     * --------------------------------------------------
     */

    function getFlags() {

        let flags = "";

        if (document.getElementById("flag-g").checked) {
            flags += "g";
        }

        if (document.getElementById("flag-i").checked) {
            flags += "i";
        }

        if (document.getElementById("flag-m").checked) {
            flags += "m";
        }

        if (document.getElementById("flag-s").checked) {
            flags += "s";
        }

        if (document.getElementById("flag-u").checked) {
            flags += "u";
        }

        return flags;
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
     * Highlight matches
     * --------------------------------------------------
     */

    function createHighlightedText(text, matches) {

        if (matches.length === 0) {

            return `
                <p class="regex-empty">
                    No matches were found in the test text.
                </p>
            `;

        }


        let output = "";
        let lastIndex = 0;


        matches.forEach(match => {

            const start = match.index;
            const end = start + match[0].length;


            /*
             * Text before the match
             */

            output += escapeHTML(
                text.slice(lastIndex, start)
            );


            /*
             * Matched text
             */

            output += `
                <mark>
                    ${escapeHTML(match[0])}
                </mark>
            `;


            lastIndex = end;

        });


        /*
         * Remaining text
         */

        output += escapeHTML(
            text.slice(lastIndex)
        );


        return output;

    }


    /*
     * --------------------------------------------------
     * Display match details
     * --------------------------------------------------
     */

    function displayMatchDetails(matches) {

        if (matches.length === 0) {

            matchDetails.innerHTML = `
                <p class="regex-empty">
                    No matches found.
                </p>
            `;

            return;
        }


        matchDetails.innerHTML = "";


        matches.forEach((match, index) => {

            const item =
                document.createElement("div");

            item.className = "regex-match-item";


            const start =
                match.index;

            const end =
                start + match[0].length;


            let groupsHTML = "";


            /*
             * Capturing groups
             */

            if (match.length > 1) {

                groupsHTML = `
                    <div class="regex-groups-title">
                        Capturing Groups
                    </div>
                `;


                for (let i = 1; i < match.length; i++) {

                    const value =
                        match[i] === undefined
                            ? "(not matched)"
                            : match[i];

                    groupsHTML += `
                        <div class="regex-group">

                            <span class="regex-group-name">
                                Group ${i}
                            </span>

                            <span class="regex-group-value">
                                ${escapeHTML(value)}
                            </span>

                        </div>
                    `;

                }

            } else {

                groupsHTML = `
                    <p class="regex-no-groups">
                        No capturing groups in this match.
                    </p>
                `;

            }


            item.innerHTML = `

                <div class="regex-match-item-header">

                    <span class="regex-match-number">
                        Match ${index + 1}
                    </span>

                    <span class="regex-match-position">
                        Position ${start}–${end}
                    </span>

                </div>


                <div class="regex-match-value">
                    ${escapeHTML(match[0])}
                </div>


                ${groupsHTML}

            `;


            matchDetails.appendChild(item);

        });

    }


    /*
     * --------------------------------------------------
     * Test regex
     * --------------------------------------------------
     */

    function testRegex() {

        hideError();


        const pattern =
            patternInput.value.trim();

        const text =
            testTextInput.value;


        if (!pattern) {

            showError(
                "Please enter a regular expression."
            );

            patternInput.focus();

            return;

        }


        if (!text) {

            showError(
                "Please enter some test text."
            );

            testTextInput.focus();

            return;

        }


        const flags =
            getFlags();


        let regex;


        /*
         * Create regex
         */

        try {

            regex =
                new RegExp(pattern, flags);

        } catch (error) {

            showError(
                `Invalid regular expression: ${error.message}`
            );

            patternInput.focus();

            return;

        }


        const matches = [];


        /*
         * Global regex
         */

        if (flags.includes("g")) {

            let match;

            /*
             * Prevent infinite loops with
             * zero-length matches.
             */

            while ((match = regex.exec(text)) !== null) {

                matches.push(match);

                if (match[0] === "") {
                    regex.lastIndex++;
                }

            }

        } else {

            const match =
                regex.exec(text);

            if (match) {
                matches.push(match);
            }

        }


        /*
         * Display results
         */

        matchCount.textContent =
            matches.length;


        highlightBox.innerHTML =
            createHighlightedText(
                text,
                matches
            );


        displayMatchDetails(matches);


        results.hidden = false;


        /*
         * Scroll to results
         */

        results.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    /*
     * --------------------------------------------------
     * Example
     * --------------------------------------------------
     */

    exampleButton.addEventListener("click", () => {

        patternInput.value =
            "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b";


        testTextInput.value =
            "Contact us at hello@example.com or support@devtoolkit.com. " +
            "You can also email admin@example.org.";


        /*
         * Enable global matching
         */

        document.getElementById("flag-g").checked = true;

        document.getElementById("flag-i").checked = true;


        hideError();

        results.hidden = true;

        patternInput.focus();

    });


    /*
     * --------------------------------------------------
     * Clear
     * --------------------------------------------------
     */

    clearButton.addEventListener("click", () => {

        patternInput.value = "";

        testTextInput.value = "";

        document.getElementById("flag-g").checked = false;
        document.getElementById("flag-i").checked = false;
        document.getElementById("flag-m").checked = false;
        document.getElementById("flag-s").checked = false;
        document.getElementById("flag-u").checked = false;

        hideError();

        results.hidden = true;

        patternInput.focus();

    });


    /*
     * --------------------------------------------------
     * Test button
     * --------------------------------------------------
     */

    testButton.addEventListener(
        "click",
        testRegex
    );


    /*
     * --------------------------------------------------
     * Ctrl + Enter
     * --------------------------------------------------
     */

    document.addEventListener("keydown", event => {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            testRegex();

        }

    });

});