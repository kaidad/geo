package com.kaidad.test;

import android.test.ActivityInstrumentationTestCase2;
import com.kaidad.geo.Geo;

public class GeoAndroidActivityTest extends ActivityInstrumentationTestCase2<Geo> {

    public GeoAndroidActivityTest() {
        super(Geo.class);
    }

    public void testActivity() {
        Geo activity = getActivity();
        assertNotNull(activity);
    }
}

