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

package com.kaidad.utilities;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class ZipUtility {

    public static void main (String ... args) throws Exception {
        if (args.length != 2) {
            System.out.println("Usage: ZipUtility sourceDirectory destination.zip");
            System.exit(1);
        }
        ZipUtility zipUtility = new ZipUtility();
        zipUtility.zipDirectory(args[0], args[1]);
    }

    /*
    * zip the folders
    */
    private void zipDirectory(String sourceDirectory, String destinationZipFile) throws Exception {
        System.out.println("Zipping source directory [" + sourceDirectory + "] to destination [" + destinationZipFile + "]");

        /*
        * create the output stream to zip file result
        */
        FileOutputStream fileWriter = new FileOutputStream(destinationZipFile);
        ZipOutputStream zip = new ZipOutputStream(fileWriter);

        /*
        * add the folder to the zip
        */
        addFolderToZip("", sourceDirectory, zip);

        /*
        * close the zip objects
        */
        zip.flush();
        zip.close();
    }

    /*
    * recursively add files to the zip files
    */
    private void addFileToZip(String path, String srcFile, ZipOutputStream zip, boolean flag) throws Exception {
        /*
        * create the file object for inputs
        */
        File folder = new File(srcFile);

        /*
        * if the folder is empty add empty folder to the Zip file
        */
        if (flag) {
            zip.putNextEntry(new ZipEntry(path + "/" + folder.getName() + "/"));
        } else {     /*
         * if the current name is directory, recursively traverse it to get the files
         */
            if (folder.isDirectory()) {
                /*
                * if folder is not empty
                */
                addFolderToZip(path, srcFile, zip);
            } else {
                /*
                 * write the file to the output
                */
                byte[] buf = new byte[1024];
                int len;
                FileInputStream in = new FileInputStream(srcFile);
                zip.putNextEntry(new ZipEntry(path + "/" + folder.getName()));
                while ((len = in.read(buf)) > 0) {
                    zip.write(buf, 0, len);
                }
            }
        }
    }

    /*
    * add folder to the zip file
    */
    private void addFolderToZip(String path, String sourceDirectory, ZipOutputStream zip)
            throws Exception {
        File sourceDirectoryObj = new File(sourceDirectory);

        /*
        * check the empty folder
        */
        if (sourceDirectoryObj.list().length == 0) {
            System.out.println(sourceDirectoryObj.getName());
            addFileToZip(path, sourceDirectory, zip, true);
        } else {
            /*
            * list the files in the folder
            */
            for (String fileName : sourceDirectoryObj.list()) {
                if (path.equals("")) {
                    addFileToZip(sourceDirectoryObj.getName(), sourceDirectory + "/" + fileName, zip, false);
                } else {
                    addFileToZip(path + "/" + sourceDirectoryObj.getName(), sourceDirectory + "/" + fileName, zip, false);
                }
            }
        }
    }
}
