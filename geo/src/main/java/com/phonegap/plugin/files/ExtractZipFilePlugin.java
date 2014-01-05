/*
 The MIT License (MIT)
 Copyright (c) 2014 David Winterbourne, Winterbourne Enterprises, LLC, dba Kaidad

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
 persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

package com.phonegap.plugin.files;

import android.util.Log;
import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Enumeration;
import java.util.zip.ZipEntry;
import java.util.zip.ZipException;
import java.util.zip.ZipFile;

import static org.apache.cordova.api.PluginResult.Status.IO_EXCEPTION;
import static org.apache.cordova.api.PluginResult.Status.JSON_EXCEPTION;
import static org.apache.cordova.api.PluginResult.Status.MALFORMED_URL_EXCEPTION;

public class ExtractZipFilePlugin extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext cbc) {
        PluginResult.Status status = PluginResult.Status.OK;
        try {
            String filename = args.getString(0);
            URL url;
            try {
                url = new URL(filename);
            } catch (MalformedURLException e) {
                throw new RuntimeException(e);
            }
            File file = new File(url.getFile());
            String[] dirToSplit = url.getFile().split(File.separator);
            String dirToInsert = "";
            for (int i = 0; i < dirToSplit.length - 1; i++) {
                dirToInsert += dirToSplit[i] + File.separator;
            }

            ZipEntry entry;
            ZipFile zipfile;
            try {
                zipfile = new ZipFile(file);
                Enumeration e = zipfile.entries();
                while (e.hasMoreElements()) {
                    entry = (ZipEntry) e.nextElement();
                    BufferedInputStream is = null;
                    try {
                        is = new BufferedInputStream(zipfile.getInputStream(entry));
                        int count;
                        byte data[] = new byte[102222];
                        String fileName = dirToInsert + entry.getName();
                        File outFile = new File(fileName);
                        if (entry.isDirectory()) {
                            if (!outFile.exists() && !outFile.mkdirs()) {
                                Log.v("info", "Unable to create directories: " + outFile.getAbsolutePath());
                                cbc.sendPluginResult(new PluginResult(IO_EXCEPTION));
                                return false;
                            }
                        } else {
                            File parent = outFile.getParentFile();
                            if (parent.mkdirs()) {
                                Log.v("info", "created directory leading to file");
                            }
                            FileOutputStream fos = null;
                            BufferedOutputStream dest = null;
                            try {
                                fos = new FileOutputStream(outFile);
                                dest = new BufferedOutputStream(fos, 102222);
                                while ((count = is.read(data, 0, 102222)) != -1) {
                                    dest.write(data, 0, count);
                                }
                            } finally {
                                if (dest != null) {
                                    dest.flush();
                                    dest.close();
                                }
                                if (fos != null) {
                                    fos.close();
                                }
                            }
                        }
                    } finally {
                        if (is != null) {
                            is.close();
                        }
                    }
                }
            } catch (ZipException e1) {
                Log.v("error", e1.getMessage(), e1);
                cbc.sendPluginResult(new PluginResult(MALFORMED_URL_EXCEPTION));
                return false;
            } catch (IOException e1) {
                Log.v("error", e1.getMessage(), e1);
                cbc.sendPluginResult(new PluginResult(IO_EXCEPTION));
                return false;
            }

        } catch (JSONException e) {
            cbc.sendPluginResult(new PluginResult(JSON_EXCEPTION));
            return false;
        }
        cbc.sendPluginResult(new PluginResult(status));
        return true;
    }
}
