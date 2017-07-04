const vscode = require('vscode');

Object.assign(exports, {
    /**
     * Returns obj with name/path pairs from define/require statement
     * @param {String} str
     * @return {Object} 
     */
    getModulesWithPathFromRequireOrDefine(str) {
        const result = {};
        const pathsAndParams = /\[(.*)\], function\s?\((.*)\)\s?{/i.exec(str);

        function splitAndTrim(str) {
            return str.split(',').map(value => value.trim());
        }

        if (pathsAndParams && pathsAndParams.length === 3) {
            const paths = splitAndTrim(pathsAndParams[1]);
            const params = splitAndTrim(pathsAndParams[2]);

            if (paths.length === params.length) {
                params.forEach((param, index) => result[param] = paths[index].replace(/'/g, ''));
            }
        }

        return result;
    },

    /**
     * Get a require or define statement from string
     * @param {String} str
     * @return {String} 
     */
    getRequireOrDefineStatement(str) {
        const match = /(define|require)\s?\(([^)]*)\)\s?{/gi.exec(str + "");
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