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

import com.google.common.io.BaseEncoding;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.jdbc.core.StatementCallback;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.sqlite.SQLiteDataSource;

import java.net.MalformedURLException;
import java.net.URL;
import java.sql.*;

/**
 * Utility to convert image BLOBs to Base64-encoded strings
 */
public class MBTilesBase64Converter {

    public static void main(String... args) throws SQLException {
        if (args.length != 1) {
            System.out.println("Usage: MBTilesBase64Converter /path/to/file.mbtiles");
            System.exit(1);
        }
        Connection c = null;
        try {
            c = connectToDb(args[0]);
//        Statement st = c.createStatement();
//        ResultSet rs = st.executeQuery("SELECT type, name, tbl_name FROM sqlite_master WHERE type='table'");
//        while(rs.next()) {
//            System.out.println("type: " + rs.getString(1) + ", name: " + rs.getString(2) + ", tbl_name: " + rs.getString(3));
//        }
            JdbcTemplate template = new JdbcTemplate(new SingleConnectionDataSource(c, true));
            executeConversion(template);
            c.commit();
        } finally {
            if (c != null) {
                c.close();
            }
        }
    }

    private static void executeConversion(JdbcTemplate c) {

        createTempTable(c);
        encodeTileData(c);
        renameTileData(c);
    }


    private static void renameTileData(JdbcTemplate c) {
        c.execute("DROP TABLE images");
        c.execute("ALTER TABLE images_string RENAME TO images");
        System.out.println("Successfully moved table 'images_string' to 'images'");
    }

    private static void createTempTable(JdbcTemplate c) {
        Integer i = c.queryForObject("select count(*) from sqlite_master WHERE type='table' AND name='images_string'", Integer.class);
        if (i == 0) {
            c.execute("create table images_string (tile_data TEXT, tile_id TEXT)");
        }
        System.out.println("Successfully created table images_string 'tile_data_string'");
    }

    private static void encodeTileData(final JdbcTemplate c) {
        c.query("SELECT tile_id, tile_data FROM images", new ResultSetExtractor<Object>() {
            @Override
            public Object extractData(ResultSet rs) throws SQLException, DataAccessException {
                while (rs.next()) {
                    String tileId = rs.getString("tile_id");
                    byte [] imageData = rs.getBytes("tile_data");
                    addTileDataToStringTable(c, tileId, BaseEncoding.base64().encode(imageData));
                }
                System.out.println("Operation done successfully");
                return null;
            }
        });
    }

    private static void addTileDataToStringTable(JdbcTemplate c, String tileId, String encodedData) {
        c.update("insert into images_string (tile_id, tile_data) values (?, ?)", tileId, encodedData);
    }

    private static Connection connectToDb(String dbName) {
        Connection c = null;
        try {
            Class.forName("org.sqlite.JDBC");
            c = DriverManager.getConnection("jdbc:sqlite:" + dbName);
            c.setAutoCommit(false);
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);
        }
        System.out.println("Opened database [" + dbName + "] successfully");
        return c;
    }
}
