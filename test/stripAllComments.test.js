const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const sinon = require('sinon');
const referenceProvider = new ReferenceProvider();

suite('stripAllComments', () => {
    test('should call stripInlineComments and stripCommentBlocks', () => {
        const stripInlineCommentsStub = sinon.stub(referenceProvider, 'stripInlineComments');
        const stripCommenBlocksStub = sinon.stub(referenceProvider, 'stripCommentBlocks');
        
        referenceProvider.stripAllComments();

        assert.ok(stripInlineCommentsStub.calledOnce);
        assert.ok(stripCommenBlocksStub.calledOnce);
    });
});