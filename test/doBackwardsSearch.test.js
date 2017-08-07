const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('doBackwardsSearch', () => {
  test('returns offset of character - 1 if character at offset equals searchFor', () => {
    const input = 'foo.baz();';
    const input2 = 'require(\'moduleA\').foo();';
    const expected = 2;
    const expected2 = 16;

        //                    foo.baz();
        // Starts searching from ^
    assert.equal(referenceProvider.doBackwardsSearch(input, 3, '.'), expected);

        //     require('moduleA').foo();
        // Starts searching from ^
    assert.equal(referenceProvider.doBackwardsSearch(input2, 17, ')'), expected2);
  });

  test('returns false if next character does not equal searchFor', () => {
    const input = `define(require => {
                           var moduleB = require('moduleB');
                       });`;
    const expected = false;

        //         var moduleB = require('moduleB');
        // Starts searching from ^
    assert.equal(referenceProvider.doBackwardsSearch(input, 61, ')'), expected);
  });

  test('ignores whitespace, tab, newline and carriage return', () => {
    const space = ' ';
    const tab = '\t';
    const newline = '\n';
    const carriageReturn = '\r';
    const input = `.${space}${tab}${newline}${carriageReturn}`;
    const expected = -1;

    assert.equal(referenceProvider.doBackwardsSearch(input, input.length - 1, '.'), expected);
  });
});
