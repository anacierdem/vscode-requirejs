const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const sinon = require('sinon');
const referenceProvider = new ReferenceProvider();

let stripAllComments, stringHasMultipleDefineOrRequireStatements, stringIsPartOfDefineOrRequireStatement, getRequireOrDefineCodeUntilCharacterIndex,
    fullText, lineAtText;

const document = { 
    getText: () => fullText,
    lineAt: () => ({ text: lineAtText })
}
const range = {
    _start : {_line: 0 }, 
    _end: { _character: 0 }
}

suite('getTextContainingWord', () => {
    setup(() => {
        stripAllComments = sinon.stub(referenceProvider, 'stripAllComments');
        stringHasMultipleDefineOrRequireStatements = sinon.stub(referenceProvider, 'stringHasMultipleDefineOrRequireStatements');
        stringIsPartOfDefineOrRequireStatement = sinon.stub(referenceProvider, 'stringIsPartOfDefineOrRequireStatement');
    });

    teardown(() => {
        referenceProvider.stripAllComments.restore();
        referenceProvider.stringHasMultipleDefineOrRequireStatements.restore();
        referenceProvider.stringIsPartOfDefineOrRequireStatement.restore();
    });

    test('should return full text when text has single define and string is not part of define', () => {
        stripAllComments.returnsArg(0);
        stringHasMultipleDefineOrRequireStatements.returns(false);
        stringIsPartOfDefineOrRequireStatement.returns(false);

        fullText = `
            fullText
            multiline
        `;

        assert.equal(referenceProvider.getTextContainingWord(document, range), fullText);
    });

    test('should return full text when text has single define and string is not part of define', () => {
        stripAllComments.returnsArg(0);
        stringHasMultipleDefineOrRequireStatements.returns(false);
        stringIsPartOfDefineOrRequireStatement.returns(true);

        fullText = `define(['./module'], function (module) {
                        const foo;
                    });`;
                    
        const expected = `define(['./module'], function (module) {`

        assert.equal(referenceProvider.getTextContainingWord(document, range), expected);
    });
    
    test('should return line containing word when multiple define or require statements in text and word is part of define or require', () => {
        stripAllComments.returnsArg(0);
        stringHasMultipleDefineOrRequireStatements.returns(true);
        stringIsPartOfDefineOrRequireStatement.returns(true);

        lineAtText = `define(['./module'], function (module) {`;

        assert.equal(referenceProvider.getTextContainingWord(document, range), lineAtText);
    });    

    test('should return part of text when multiple define or require statements in text and word is not part of define or require', () => {
        stripAllComments.returnsArg(0);
        stringHasMultipleDefineOrRequireStatements.returns(true);
        stringIsPartOfDefineOrRequireStatement.returns(false);

        const partOfText = `part`;
        sinon.stub(referenceProvider, 'getRequireOrDefineCodeUntilCharacterIndex').returns(partOfText);

        assert.equal(referenceProvider.getTextContainingWord(document, range), partOfText);

        referenceProvider.getRequireOrDefineCodeUntilCharacterIndex.restore();        
    });
});