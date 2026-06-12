import { spawn } from 'child_process';
import path from 'path';

function getPythonExecutable() {
  return (
    process.env.CODEX_PYTHON ||
    'C:\\Users\\directvector\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe'
  );
}

export async function runPythonJsonScript(scriptRelativePath: string, payload: unknown) {
  const repoRoot = path.resolve(process.cwd(), '..');
  const scriptPath = path.join(repoRoot, scriptRelativePath);
  const python = getPythonExecutable();

  return new Promise<unknown>((resolve, reject) => {
    const child = spawn(python, [scriptPath], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `Python bridge failed with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${stdout}\n${String(error)}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}
