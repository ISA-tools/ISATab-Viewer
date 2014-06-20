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

ISATabViewer.spreadsheets = {
    "files": {}
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

                    var filename = file_data.files[0];

                    if (filename.indexOf('i_') != -1) {
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

                        ISATabViewer.spreadsheets.files[filename] = {"headers": [], "rows": []};
                        var divs = $(xmlDoc).find('div.line');

                        var count = 0;
                        for (var div in divs) {
                            if (divs[div].innerHTML) {
                                var line_contents = divs[div].innerHTML.trim();
                                parts = line_contents.split(ISATabViewer.options.splitter);
                                var processed_parts = [];
                                parts.forEach(function(part) {
                                   processed_parts.push(ISATabViewer.rendering.replace_str("\"", "", part));
                                });
                                if (count == 0) {
                                    // we have the headers
                                    ISATabViewer.spreadsheets.files[filename]["headers"] = processed_parts;
                                } else {
                                    ISATabViewer.spreadsheets.files[filename]["rows"].push({"columns": processed_parts});
                                }
                                count++;
                            }
                        }
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

        var source = $("#study-list-template").html();
        var template = Handlebars.compile(source);
        var html = template({"studies": studies});
        $("#study-list").append(html);

        ISATabViewer.rendering.render_study(studies[0]);
    },

    set_active_list_item: function (study_id) {
        $("#study-list").find("li").each(function () {
            $(this).removeClass("active");
        });

        $("#list-" + study_id).addClass("active");
    },


    render_study: function (study_id) {

        this.set_active_list_item(study_id);

        $("#isa-breadcrumb-items").html('<li class="active">' + study_id + '</li>');
        var study = {};
        for (var study_index in ISATabViewer.investigation.STUDY) {
            var study_information = ISATabViewer.investigation.STUDY[study_index];

            if (study_information.STUDY["Study Identifier"][0].indexOf(study_id) != -1) {
                study.study_id = ISATabViewer.rendering.replace_str("\"", "", study_information.STUDY["Study Identifier"][0]);
                study.study_title = ISATabViewer.rendering.replace_str("\"", "", study_information.STUDY["Study Title"][0]);
                study.study_description = ISATabViewer.rendering.replace_str("\"", "", study_information.STUDY["Study Description"][0]);


                study.publications = ISATabViewer.rendering.generate_records(study_information, "STUDY PUBLICATIONS");
                study.protocols = ISATabViewer.rendering.generate_records(study_information, "STUDY PROTOCOLS");
                study.contacts = ISATabViewer.rendering.generate_records(study_information, "STUDY CONTACTS");
                study.factors = ISATabViewer.rendering.generate_records(study_information, "STUDY FACTORS");
                study.assays = ISATabViewer.rendering.generate_records(study_information, "STUDY ASSAYS");

                ISATabViewer.rendering.postprocess_assay_records(study.assays);
            }
        }

        var source = $("#study-template").html();
        var template = Handlebars.compile(source);
        var html = template(study);

        $("#study-info").html(html);
    },

    render_assay: function (study_id, file_name) {

        $("#isa-breadcrumb-items").html('<li onclick="ISATabViewer.rendering.render_study(\'' + study_id + '\')">' + study_id + '</li><li class="active">' + file_name + '</li>');


        var spreadsheet = ISATabViewer.spreadsheets.files[file_name];
        var source = $("#table-template").html();
        var template = Handlebars.compile(source);
        var html = template(spreadsheet);

        $("#study-info").html(html);
    },

    /*
     This function adds in information about which images to use for example to show a particular type of assay.
     */
    postprocess_assay_records: function (records) {
        for (var assay_index in records) {
            var assay = records[assay_index];

            var measurement_type = assay["Study Assay Measurement Type"];

            assay.icon = measurement_type.indexOf("metabolite") >= 0 ? "assay-icon-metabolomics"
                : measurement_type.indexOf("prote") >= 0 ? "assay-icon-proteomics"
                : measurement_type.indexOf("transcript") >= 0 ? "assay-icon-transcriptomics"
                : measurement_type.indexOf("chemistry") >= 0 ? "assay-icon-chemistry"
                : measurement_type.indexOf("genom") >= 0 ? "assay-icon-genomics"
                : "";

        }
    },

    generate_records: function (study_information, field_name) {
        var result = [];
        for (var field in study_information[field_name]) {

            var records = study_information[field_name][field];
            for (var i = 0; i < records.length; i++) {
                if (result[i] == undefined) {
                    result[i] = {}
                }


                result[i][field] = ISATabViewer.rendering.replace_str("\"", "", records[i]);
            }
        }

        return result;
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