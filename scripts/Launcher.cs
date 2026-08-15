using System;
using System.IO;
using System.Net;
using System.Diagnostics;
using System.Threading;
using System.Runtime.InteropServices;

namespace CrazyGoLauncher
{
    class Program
    {
        [DllImport("kernel32.dll")]
        static extern IntPtr GetConsoleWindow();

        [DllImport("user32.dll")]
        static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        const int SW_HIDE = 0;

        static HttpListener listener;
        static string baseDirectory;
        static int port = 5174;
        static bool running = true;

        static void Main(string[] args)
        {
            // Ocultar consola si se ejecuta como aplicación de ventana
            IntPtr handle = GetConsoleWindow();
            if (handle != IntPtr.Zero)
            {
                ShowWindow(handle, SW_HIDE);
            }

            string exeDir = AppDomain.CurrentDomain.BaseDirectory;
            baseDirectory = Path.Combine(exeDir, "dist");

            if (!Directory.Exists(baseDirectory))
            {
                baseDirectory = exeDir;
            }

            // Buscar puerto disponible
            for (int p = 5174; p < 5200; p++)
            {
                try
                {
                    listener = new HttpListener();
                    listener.Prefixes.Add("http://127.0.0.1:" + p + "/");
                    listener.Start();
                    port = p;
                    break;
                }
                catch
                {
                    if (listener != null) listener.Close();
                }
            }

            if (!listener.IsListening)
            {
                return;
            }

            // Iniciar hilo del servidor HTTP embebido
            Thread serverThread = new Thread(RunServer);
            serverThread.IsBackground = true;
            serverThread.Start();

            // Abrir ventana en modo aplicación nativa independiente (Edge/Chrome app mode con perfil aislado)
            string appUrl = "http://127.0.0.1:" + port + "/";
            Process appProcess = LaunchAppWindow(appUrl);

            if (appProcess != null)
            {
                appProcess.WaitForExit();
            }
            else
            {
                Process.Start(appUrl);
                // Si abrió en navegador por defecto, mantener servidor vivo mientras haya actividad
                while (running)
                {
                    Thread.Sleep(5000);
                }
            }

            running = false;
            try { listener.Stop(); } catch { }
        }

        static Process LaunchAppWindow(string url)
        {
            string profileDir = Path.Combine(Path.GetTempPath(), "CrazyGo_AppData");
            string commonArgs = "--app=" + url + " --user-data-dir=\"" + profileDir + "\" --window-size=1366,860 --app-id=CrazyGoGame --disable-extensions --no-first-run --no-default-browser-check";

            // 1. Microsoft Edge (presente de forma nativa en todo Windows 10 y 11)
            string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft\\Edge\\Application\\msedge.exe");
            if (!File.Exists(edgePath))
            {
                edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft\\Edge\\Application\\msedge.exe");
            }

            if (File.Exists(edgePath))
            {
                try
                {
                    return Process.Start(new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = commonArgs,
                        UseShellExecute = false
                    });
                }
                catch { }
            }

            // 2. Google Chrome
            string chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google\\Chrome\\Application\\chrome.exe");
            if (!File.Exists(chromePath))
            {
                chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google\\Chrome\\Application\\chrome.exe");
            }

            if (File.Exists(chromePath))
            {
                try
                {
                    return Process.Start(new ProcessStartInfo
                    {
                        FileName = chromePath,
                        Arguments = commonArgs,
                        UseShellExecute = false
                    });
                }
                catch { }
            }

            return null;
        }

        static void RunServer()
        {
            while (running && listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem((state) => HandleRequest(context));
                }
                catch
                {
                    if (!running) break;
                }
            }
        }

        static void HandleRequest(HttpListenerContext context)
        {
            try
            {
                string rawUrl = context.Request.RawUrl;
                if (rawUrl.Contains("?"))
                {
                    rawUrl = rawUrl.Substring(0, rawUrl.IndexOf('?'));
                }

                string relativePath = rawUrl.TrimStart('/');
                if (string.IsNullOrEmpty(relativePath))
                {
                    relativePath = "index.html";
                }

                string filePath = Path.Combine(baseDirectory, relativePath.Replace('/', Path.DirectorySeparatorChar));

                if (!File.Exists(filePath))
                {
                    // Fallback a index.html para SPA
                    filePath = Path.Combine(baseDirectory, "index.html");
                }

                if (File.Exists(filePath))
                {
                    byte[] buffer = File.ReadAllBytes(filePath);
                    context.Response.ContentType = GetMimeType(Path.GetExtension(filePath));
                    context.Response.ContentLength64 = buffer.Length;
                    context.Response.StatusCode = 200;
                    context.Response.OutputStream.Write(buffer, 0, buffer.Length);
                }
                else
                {
                    context.Response.StatusCode = 404;
                }
            }
            catch { }
            finally
            {
                try { context.Response.OutputStream.Close(); } catch { }
            }
        }

        static string GetMimeType(string extension)
        {
            switch (extension.ToLower())
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                case ".json": return "application/json";
                case ".ico": return "image/x-icon";
                case ".mp3": return "audio/mpeg";
                case ".wav": return "audio/wav";
                case ".woff2": return "font/woff2";
                case ".woff": return "font/woff";
                case ".ttf": return "font/ttf";
                default: return "application/octet-stream";
            }
        }
    }
}
