const { workspace, Range } = require('vscode');
const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('extractString', () => {
  test('should return line when no quotes are detected', () =>
        workspace.openTextDocument(__dirname.replace('test', '') + 'testFiles/basic.js')
            .then(document => {
              assert.equal(
                    referenceProvider.extractString(document, new Range(1, 4, 1, 15)),
                    '    var foo = a;'
                );
            })
    );

  test('should return text within quotes', () =>
        workspace.openTextDocument(__dirname.replace('test', '') + 'testFiles/immediatelyInvoked.js')
            .then(document => {
              assert.equal(
                    referenceProvider.extractString(document, new Range(0, 11, 0, 12)),
                    'moduleA'
                );
            })
    );
});
