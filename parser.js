const vscode = require('vscode');

Object.assign(exports, {
    /**
     * Returns obj with name/path pairs from define/require statement
     * @param {String} str
     * @return {Object} 
     */
    getModulesWithPathFromRequireOrDefine(str) {
        let list, result;
        const array = /\[[^\]]*\]/gi;
        const params = /function\s*\([^)]*/gi;

        var m = array.exec(str);

        if(m) {
            list = JSON.parse(m[0].split("'").join("\""));
        }

        m = params.exec(str);

        if(m) {
            var test = /([^\s,]+)/g;
            result = m[0].slice(m[0].indexOf('(')+1).match(test);
        }

        const parsedResult = {}

        if(result) {
            result.forEach((value, index) => parsedResult[value] = list[index]);
        }

        return parsedResult;
    },

    /**
     * Get a require or define statement from string
     * @param {String} str
     * @return {String} 
     */
    getRequireOrDefineStatement(str) {
        const match = /(define|require)\s*\(([^)]*)/gi.exec(str + "");
        return match && match[0] || null;
    },

    /**
     * Strip comments from string
     * @param {String} str
     * @return {String} 
     */
    removeComments(str) {
        return (str + "").replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
    },

    /**
     * Search for constructor patterns in haystack and return locations
     * @param {VSCode Document} document
     * @param {String} needle
     * @param {String} haystack
     */
    findConstructor(document, needle, haystack) {
        let searchResult;
        const references = [];

        const test = new RegExp("(?:"+needle+"\\s*=\\s*(?:new)?\\s*)([^\\s(;]*)", "ig");

        do {
            searchResult = test.exec(haystack);
            if (searchResult) {
                var newPosition = document.positionAt(searchResult.index + searchResult[0].indexOf(searchResult[1]));

                var range = document.getWordRangeAtPosition(newPosition);
                if(range)
                    references.push(new vscode.Location(document.uri, range));
            }
        } while (searchResult);

        return references;
    },

    /**
     * returns the string literal's contents in document covering range
     * @param {VSCode Document} document Document to extract the string
     * @param {VSCode Range} range Seed range
     */
    extractString(document, range) {
        var char;

        var line = document.lineAt(range._start._line).text;

        var startOffset = 0;
        while(char = line[range._start._character-startOffset], char != "'" && char != "\"" && range._start._character-startOffset >= 0) {
            startOffset++;
        }

        var endOffset = 0;
        while(char = line[range._start._character+endOffset], char != "'" && char != "\"" && range._start._character+endOffset < line.length) {
            endOffset++;
        }
        return document.getText( new vscode.Range(
                new vscode.Position(range._start._line, range._start._character-startOffset+1),
                new vscode.Position(range._start._line, range._start._character+endOffset)
            ))
    }
});