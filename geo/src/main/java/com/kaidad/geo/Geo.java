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

package com.kaidad.geo;

import android.os.Bundle;
import android.os.Debug;
import org.apache.cordova.Config;
import org.apache.cordova.DroidGap;

public class Geo extends DroidGap {

    private static final boolean DEBUG = false;
    public static final String TRACE_NAME = "geo";

    @Override
    protected void onPause() {
        super.onPause();
        if (DEBUG) {
            Debug.stopMethodTracing();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (DEBUG) {
            Debug.stopMethodTracing();
        }
    }

    @Override
    protected void onResume() {
        if (DEBUG) {
            Debug.startMethodTracing(TRACE_NAME);
        }
        super.onResume();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        if (DEBUG) {
            Debug.startMethodTracing(TRACE_NAME);
        }

        super.onCreate(savedInstanceState);
        super.loadUrl(Config.getStartUrl());
    }
}

