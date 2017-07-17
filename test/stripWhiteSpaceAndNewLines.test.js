const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('stripwhiteSpaceAndNewLines', () => {
    test('should strip white space and new lines', () => {
        const space = ' ';
        const tab = `   `;
        const newline = "\n";
        const carriageReturn = "\r";
        const input = `!${space}${tab}${newline}${carriageReturn}!`;
        const expected = '!!';
        
        assert.equal(referenceProvider.stripWhiteSpaceAndNewLines(input), expected);
    });
});