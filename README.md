# Something Something AI, I am not reading this

## Django Test Path Handler

An extension that allows you to easily copy the path of your test files using dot notation instead of slashes.

## Features

- Copy the path of the current file using dot notation instead of slashes
- Configure a prefix to be added before the path
- Configure a suffix to be added after the path
- Trim a configurable number of folders from the beginning of the path
- Detect Python class methods and include them in the path (e.g., `test_folder.tests.test_file.TestClass.test_method`)

This extension is particularly useful for Django developers who need to run specific tests using the `python manage.py test` command, which accepts paths in dot notation.

## Usage

1. Open a file in your workspace
2. Use one of the following methods:
   - Use keyboard shortcuts:
     - `Copy Path as Dot Notation`: `Ctrl+Alt+D` / `Cmd+Alt+D`
     - `Copy Path with Prefix/Suffix`: `Ctrl+Alt+P` / `Cmd+Alt+P`
     - `Copy Path with Python Method`: `Ctrl+Alt+M` / `Cmd+Alt+M` (Python files only)
   - Right-click in the editor and select from the context menu
   - Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for the commands

Example:
- Original path: `project/app/tests/test_models.py`
- Copied path: `project.app.tests.test_models`
- With prefix `python manage.py test`: `python manage.py test project.app.tests.test_models`
- With Python method: `python manage.py test project.app.tests.test_models.TestUser.test_create_user`

### Python Method Detection

The extension can automatically detect Python methods and include them in the path:

- If text is selected, it will use that as the method name
- If the cursor is on a method definition line, it extracts the method name
- If the cursor is within a method, it detects both the method and its containing class
- If only a class is found, it includes only the class name

This is particularly useful for running specific test methods in Django:

```
# Original command
python manage.py test app.tests.test_models

# With method detection
python manage.py test app.tests.test_models.TestUser.test_create_user
```

## Extension Settings

This extension contributes the following settings:

* `djangoPathHandler.prefix`: Text to be added before the path
* `djangoPathHandler.suffix`: Text to be added after the path
* `djangoPathHandler.trimFolders`: Number of folders to remove from the beginning of the path

## Example Configuration

```json
{
  "djangoPathHandler.prefix": "poetry run python manage.py test",
  "djangoPathHandler.suffix": "--keepdb",
  "djangoPathHandler.trimFolders": 1
}
```

With this configuration:
- Original path: `project/app/tests/test_models.py`
- Result after trimming one folder: `app.tests.test_models`
- Final output: `poetry run python manage.py test app.tests.test_models --keepdb`

## Installation

### From VSIX File

1. Download the `.vsix` file from the releases page or build it yourself (see Development section).

2. In VS Code:
   - Open VS Code
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS) to open the Extensions view
   - Click on the More Actions button (three dots) in the top-right corner
   - Select "Install from VSIX..."
   - Navigate to and select the downloaded `.vsix` file

3. In Cursor:
   - Open Cursor
   - Go to Extensions (puzzle piece icon)
   - Click on the "..." (three dots) in the upper right corner
   - Select "Install from VSIX..."
   - Choose the `.vsix` file
   - Restart Cursor if prompted

4. From Command Line:
   ```
   code --install-extension your-extension-file.vsix
   ```
   For Cursor, use the Cursor command:
   ```
   cursor --install-extension your-extension-file.vsix
   ```

After installation, you may need to reload your editor window.

## Development

### Local Installation

To install the extension locally without publishing to VS Code Marketplace:

1. Build the VSIX package:
   ```
   npm install -g @vscode/vsce
   npm run compile
   vsce package
   ```

2. Install the extension from the VSIX file:
   - Open VS Code
   - Go to Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
   - Click on the "..." menu in the top-right corner
   - Select "Install from VSIX..."
   - Navigate to the generated .vsix file and select it

Alternatively, you can use the Extension Development Host:
1. Open the project in VS Code
2. Press F5 to start debugging
3. A new VS Code window will open with the extension loaded

### Running Tests

To run the extension tests:

```
npm run test
```

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
