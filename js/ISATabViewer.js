/**
 * Created by eamonnmaguire on 19/06/2014.
 */

var ISATabViewer = {};

ISATabViewer.investigation = {"ONTOLOGY SOURCE REFERENCE": [],
    "INVESTIGATION": [],
    "INVESTIGATION CONTACTS": [],
    "INVESTIGATION PUBLICATIONS": [],
    "studies": []};


ISATabViewer.rendering = {

    /*
     * Renders ISATab given an investigation url which is retrieved and processed and options to configure the display
     *
     */

    render_gist: function (gist, gist_id, placement) {
        console.log(gist);
        $(placement).html(gist.description);

        for (var file in gist.files) {


            $(placement).append(gist.files[file]);
            $(placement).append('<br/>');
            $.ajax({
                url: 'https://gist.github.com/' + gist_id + '.json?file=' + gist.files[file],
                dataType: 'jsonp',
                success: function (file_data) {

//                    we will be breaking things down in to investigation, study and assays. Then rendering everything at the end.
                    var xmlDoc = $.parseXML(file_data.div);

                    if (file_data.files[0].indexOf('i_') != -1) {
//                        process investigation file

                        var divs = $(xmlDoc).find('div.line');

                        var current_section = "";
                        for (var div in divs) {
                            if (divs[div].innerHTML) {
                                var line_contents = divs[div].innerHTML.trim();

                                console.log(line_contents);
                                if (line_contents in ISATabViewer.investigation) {
                                    console.log("Setting current section to " + line_contents);
                                    current_section = line_contents;
                                } else {
                                    ISATabViewer.investigation[current_section].push(line_contents);
                                }
                                $(placement).append(divs[div].innerHTML);
                            }
                        }

                        console.log(ISATabViewer.investigation);
                    }


                    $(placement).append('<br/>');
                }
            });
        }
    },


    render_isatab_from_gist: function (gist_id, placement, options) {

        $.ajax({
            url: 'https://gist.github.com/' + gist_id + '.json',
            dataType: 'jsonp',
            success: function (gist) {
                ISATabViewer.rendering.render_gist(gist, gist_id, placement)
            }
        });
    }
};