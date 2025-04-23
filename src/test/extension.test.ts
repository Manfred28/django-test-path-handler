import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as fs from 'fs';
import { after, before } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

suite('Django Path Handler Extension Tests', () => {
	const testFilePath = path.join(__dirname, 'fixtures', 'test_folder', 'tests', 'test_file.py');
	const pythonTestFilePath = path.join(__dirname, 'fixtures', 'test_folder', 'tests', 'test_class_file.py');
	let clipboardStub: sinon.SinonStub;
	let showInfoStub: sinon.SinonStub;
	let getConfigStub: sinon.SinonStub;
	let workspaceFolderStub: sinon.SinonStub;
	let testFileUri: vscode.Uri;
	let pythonTestFileUri: vscode.Uri;

	before(async () => {
		// Create test file structure if it doesn't exist
		const fixturesDir = path.join(__dirname, 'fixtures');
		const testFolderDir = path.join(fixturesDir, 'test_folder');
		const testsDir = path.join(testFolderDir, 'tests');
		
		if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir);
		if (!fs.existsSync(testFolderDir)) fs.mkdirSync(testFolderDir);
		if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir);
		
		if (!fs.existsSync(testFilePath)) {
			fs.writeFileSync(testFilePath, '# Test file for Django Path Handler');
		}

		// Create a Python test file with class and methods
		if (!fs.existsSync(pythonTestFilePath)) {
			const pythonContent = `
# Test file with Python classes and methods
class TestUser:
    def test_create_user(self):
        self.assertTrue(True)
        
    def test_update_user(self):
        self.assertTrue(True)
        
class TestPost:
    def test_create_post(self):
        self.assertTrue(True)
`;
			fs.writeFileSync(pythonTestFilePath, pythonContent);
		}
		
		// Create URI for test files
		testFileUri = vscode.Uri.file(testFilePath);
		pythonTestFileUri = vscode.Uri.file(pythonTestFilePath);
		
		// Activate extension
		await vscode.extensions.getExtension('django-test-path-handler')?.activate();
	});

	beforeEach(() => {
		// Stub clipboard writeText method
		clipboardStub = sinon.stub(vscode.env.clipboard, 'writeText').resolves();
		
		// Stub showInformationMessage
		showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');
		
		// Mock workspace folder
		workspaceFolderStub = sinon.stub(vscode.workspace, 'getWorkspaceFolder');
		workspaceFolderStub.returns({ uri: vscode.Uri.file(path.join(__dirname, 'fixtures')) } as vscode.WorkspaceFolder);
		
		// Mock config
		getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
		getConfigStub.returns({
			get: (key: string) => {
				switch (key) {
					case 'prefix': return '';
					case 'suffix': return '';
					case 'trimFolders': return 0;
					default: return undefined;
				}
			}
		} as any);
	});

	afterEach(() => {
		clipboardStub.restore();
		showInfoStub.restore();
		getConfigStub.restore();
		workspaceFolderStub.restore();
	});

	test('Copy Path as Dot Notation - Basic Functionality', async () => {
		// Mock the active editor
		const docStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => {
			return {
				document: {
					uri: testFileUri
				}
			} as any;
		});

		// Execute command
		await vscode.commands.executeCommand('djangoPathHandler.copyPathAsDotNotation');
		
		// Verify clipboard was called with the correct path
		sinon.assert.calledWith(clipboardStub, 'test_folder.tests.test_file');
		
		docStub.restore();
	});

	test('Copy Path with Prefix/Suffix', async () => {
		// Update mock config to include prefix and suffix
		getConfigStub.returns({
			get: (key: string) => {
				switch (key) {
					case 'prefix': return 'python manage.py test';
					case 'suffix': return '--keepdb';
					case 'trimFolders': return 0;
					default: return undefined;
				}
			}
		} as any);

		// Mock the active editor
		const docStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => {
			return {
				document: {
					uri: testFileUri
				}
			} as any;
		});

		// Execute command
		await vscode.commands.executeCommand('djangoPathHandler.copyWithPrefixSuffix');
		
		// Verify clipboard was called with the correct path
		sinon.assert.calledWith(clipboardStub, 'python manage.py test test_folder.tests.test_file --keepdb');
		
		docStub.restore();
	});

	test('Path with trimFolders setting', async () => {
		// Update mock config to trim the first folder
		getConfigStub.returns({
			get: (key: string) => {
				switch (key) {
					case 'prefix': return '';
					case 'suffix': return '';
					case 'trimFolders': return 1;
					default: return undefined;
				}
			}
		} as any);

		// Mock the active editor
		const docStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => {
			return {
				document: {
					uri: testFileUri
				}
			} as any;
		});

		// Execute command
		await vscode.commands.executeCommand('djangoPathHandler.copyPathAsDotNotation');
		
		// Verify clipboard was called with the correct trimmed path
		sinon.assert.calledWith(clipboardStub, 'tests.test_file');
		
		docStub.restore();
	});

	test('Python method detection - cursor on method definition', async () => {
		// Mock config
		getConfigStub.returns({
			get: (key: string) => {
				switch (key) {
					case 'prefix': return 'python manage.py test';
					case 'suffix': return '';
					case 'trimFolders': return 0;
					default: return undefined;
				}
			}
		} as any);

		// Mock the file content read
		const fileContentLines = [
			'# Test file with Python classes and methods',
			'class TestUser:',
			'    def test_create_user(self):',
			'        self.assertTrue(True)',
			'',
			'    def test_update_user(self):',
			'        self.assertTrue(True)',
			'',
			'class TestPost:',
			'    def test_create_post(self):',
			'        self.assertTrue(True)'
		];

		// Mock the active editor with cursor on method definition line
		const docStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => {
			return {
				document: {
					uri: pythonTestFileUri,
					getText: () => fileContentLines.join('\n'),
					lineAt: (line: number) => ({
						text: fileContentLines[line]
					}),
					languageId: 'python'
				},
				selection: new vscode.Selection(
					new vscode.Position(2, 4), // Line 3 (0-indexed), col 4
					new vscode.Position(2, 4)  // Same position, empty selection
				)
			} as any;
		});

		// Execute command
		await vscode.commands.executeCommand('djangoPathHandler.copyWithSelectedMethod');
		
		// Verify clipboard was called with the correct path including class and method
		sinon.assert.calledWith(clipboardStub, 'python manage.py test test_folder.tests.test_class_file.TestUser.test_create_user');
		
		docStub.restore();
	});

	test('Python method detection - cursor inside method', async () => {
		// Mock config
		getConfigStub.returns({
			get: (key: string) => {
				switch (key) {
					case 'prefix': return 'python manage.py test';
					case 'suffix': return '';
					case 'trimFolders': return 0;
					default: return undefined;
				}
			}
		} as any);

		// Mock the file content read
		const fileContentLines = [
			'# Test file with Python classes and methods',
			'class TestUser:',
			'    def test_create_user(self):',
			'        self.assertTrue(True)',
			'',
			'    def test_update_user(self):',
			'        self.assertTrue(True)',
			'',
			'class TestPost:',
			'    def test_create_post(self):',
			'        self.assertTrue(True)'
		];

		// Mock the active editor with cursor inside method body
		const docStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => {
			return {
				document: {
					uri: pythonTestFileUri,
					getText: () => fileContentLines.join('\n'),
					lineAt: (line: number) => ({
						text: fileContentLines[line]
					}),
					languageId: 'python'
				},
				selection: new vscode.Selection(
					new vscode.Position(3, 8), // Line 4 (0-indexed), col 8 - inside method body
					new vscode.Position(3, 8)  // Same position, empty selection
				)
			} as any;
		});

		// Execute command
		await vscode.commands.executeCommand('djangoPathHandler.copyWithSelectedMethod');
		
		// Verify clipboard was called with the correct path including class and method
		sinon.assert.calledWith(clipboardStub, 'python manage.py test test_folder.tests.test_class_file.TestUser.test_create_user');
		
		docStub.restore();
	});

	test('Python method detection - text selection', async () => {
		// Mock config
		getConfigStub.returns({
			get: (key: string) => {
				switch (key) {
					case 'prefix': return 'python manage.py test';
					case 'suffix': return '';
					case 'trimFolders': return 0;
					default: return undefined;
				}
			}
		} as any);

		// Mock the file content
		const fileContentLines = [
			'# Test file with Python classes and methods',
			'class TestUser:',
			'    def test_create_user(self):',
			'        self.assertTrue(True)',
			'',
			'    def test_update_user(self):',
			'        self.assertTrue(True)',
			'',
			'class TestPost:',
			'    def test_create_post(self):',
			'        self.assertTrue(True)'
		];

		// Mock the active editor with selected text
		const docStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => {
			return {
				document: {
					uri: pythonTestFileUri,
					getText: (range?: vscode.Range) => {
						if (range) {
							// Return the selected text
							return 'TestUser.custom_selection';
						}
						return fileContentLines.join('\n');
					},
					lineAt: (line: number) => ({
						text: fileContentLines[line]
					}),
					languageId: 'python'
				},
				selection: new vscode.Selection(
					new vscode.Position(2, 0),  // Start of selection
					new vscode.Position(2, 22)  // End of selection - arbitrary
				)
			} as any;
		});

		// Execute command
		await vscode.commands.executeCommand('djangoPathHandler.copyWithSelectedMethod');
		
		// Verify clipboard was called with the correct path using selected text
		sinon.assert.calledWith(clipboardStub, 'python manage.py test test_folder.tests.test_class_file.TestUser.custom_selection');
		
		docStub.restore();
	});
});
