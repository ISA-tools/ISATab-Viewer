

var Explorer = {}


Explorer.Files = {

    getFiles : function(myCallback){
         $.ajax({
              url : "../test_data_sets",
              success : function(data, callback){
                var html = $.parseHTML(data);
                var filenames = [];
                $(html).find("li").each(function (index) {
                    console.log(index + ": " + $(this).text());
                    filenames[index] = $(this).text().trim();
                });
                //console.log(filenames);
                console.log(myCallback);
                myCallback(filenames);
              }
           });
    }

}


