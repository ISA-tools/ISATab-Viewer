/**
 * Created by eamonnmaguire on 19/06/2014.
 */

var ISATabViewer = {};

ISATabViewer.investigation = {"ONTOLOGY SOURCE REFERENCE": {},
    "INVESTIGATION": {},
    "INVESTIGATION CONTACTS": {},
    "INVESTIGATION PUBLICATIONS": {},
    "STUDY": []};

ISATabViewer.options = {
    splitter: "\t"  // for TSV or "," for CSV
};


ISATabViewer.rendering = {

    /*
     * Renders ISATab given an investigation url which is retrieved and processed and options to configure the display
     *
     */

    process_gist: function (gist, gist_id, placement) {

        for (var file in gist.files) {
            $.ajax({
                url: 'https://gist.github.com/' + gist_id + '.json?file=' + gist.files[file],
                dataType: 'jsonp',
                success: function (file_data) {

                    // we will be breaking things down in to investigation, study and assays. Then rendering everything at the end.
                    var xmlDoc = $.parseXML(file_data.div);

                    if (file_data.files[0].indexOf('i_') != -1) {
                        // process investigation file

                        var divs = $(xmlDoc).find('div.line');

                        var current_section = "";
                        var current_study;

                        for (var div in divs) {
                            if (divs[div].innerHTML) {
                                var line_contents = divs[div].innerHTML.trim();

                                if (line_contents in ISATabViewer.investigation || (current_study != undefined && line_contents in current_study)) {
                                    current_section = line_contents;
                                    if (current_section == 'STUDY') {
                                        if (current_study != undefined) ISATabViewer.investigation["STUDY"].push(current_study);
                                        current_study = ISATabViewer.rendering.create_study_template();
                                    }
                                } else {
                                    var parts = line_contents.split(ISATabViewer.options.splitter);

                                    if (parts.length > 0) {


                                        if (current_study != undefined) {
                                            current_study[current_section][parts[0]] = $.grep(parts, function (v, i) {
                                                return v != "" && i != 0;
                                            });
                                        } else {
                                            ISATabViewer.investigation[current_section][parts[0]] = $.grep(parts, function (v, i) {
                                                return v != "" && i != 0;
                                            });
                                        }
                                    }

                                }
                            }
                        }

                        if (current_study != undefined) ISATabViewer.investigation["STUDY"].push(current_study);

                        console.log(ISATabViewer.investigation);

                        ISATabViewer.rendering.render_study_list(placement);
                    } else {
                        // process study sample and assay files...
                        // samples will have links to the assay created automatically. types will be preserved.
                    }

                }
            });
        }
    },

    render_study_list: function () {
        // Render study list
        var studies = [];

        for (var study_index in ISATabViewer.investigation.STUDY) {
            studies.push(ISATabViewer.rendering.replace_str("\"", "", ISATabViewer.investigation.STUDY[study_index].STUDY["Study Identifier"][0]));
        }

        $("#isa-breadcrumb-items").html('<li class="active">' + studies[0] + '</li>');

        ISATabViewer.rendering.render_study(studies[0]);

        var source = $("#study-list-template").html();
        var template = Handlebars.compile(source);
        var html = template({"studies": studies});
        $("#study-list").append(html);
    },

    render_study: function (study_id) {
        console.log(study_id);
        var study = {};
        for (var study_index in ISATabViewer.investigation.STUDY) {
            var study_information = ISATabViewer.investigation.STUDY[study_index];


            if (study_information.STUDY["Study Identifier"][0].indexOf(study_id) != -1) {

                console.log('Found study!!');
                study.study_id = ISATabViewer.rendering.replace_str("\"", "", study_information.STUDY["Study Identifier"][0]);
                study.study_title = ISATabViewer.rendering.replace_str("\"", "",study_information.STUDY["Study Title"][0]);
                study.study_description = ISATabViewer.rendering.replace_str("\"", "",study_information.STUDY["Study Description"][0]);
                console.log(study);
            }
        }

        var source = $("#study-template").html();
        var template = Handlebars.compile(source);
        var html = template(study);

        $("#study-info").html(html);
    },


    replace_str: function (find, replace, str) {
        return str.replace(new RegExp(find, 'g'), replace);
    },


    render_isatab_from_gist: function (gist_id, placement, options) {

        $.ajax({
            url: 'https://gist.github.com/' + gist_id + '.json',
            dataType: 'jsonp',
            success: function (gist) {
                ISATabViewer.rendering.process_gist(gist, gist_id, placement)
            }
        });
    },

    create_study_template: function () {
        return {
            "STUDY": {},
            "STUDY CONTACTS": {},
            "STUDY PUBLICATIONS": {},
            "STUDY FACTORS": {},
            "STUDY DESIGN DESCRIPTORS": {},
            "STUDY ASSAYS": {},
            "STUDY PROTOCOLS": {}
        };
    }
};