/**
 * Created by fedotov on 29.03.16.
 */


//Some global vars
glyph_opts = {
    map: {
        doc: "fa fa-file-text fa-fw",
        docOpen: "fa fa-file-text fa-fw",
        checkbox: "fa fa-square-o fa-fw",
        checkboxSelected: "fa fa-check-square-o fa-fw",
        checkboxUnknown: "fa fa-share-square-o fa-fw",
        dragHelper: "fa fa-play",
        dropMarker: "fa fa-arrow-right",
        error: "fa fa-exclamation-triangle",
        expanderClosed: "fa fa-caret-right fa-fw",
        expanderLazy: "fa fa-caret-right fa-fw",  // fa-plus-sign
        expanderOpen: "fa fa-caret-down fa-fw",  // fa-collapse-down
        folder: "fa fa-folder fa-fw",
        folderOpen: "fa fa-folder-open fa-fw",
        loading: "fa fa-refresh fa-spin fa-fw",
        // my icons:
        User: "fa fa-fw fa-user",
        Computer: "fa fa-fw fa-desktop",
        Group: "fa fa-fw fa-users",
        Contact: "fa fa-fw fa-credit-card"
    }
};
selected_node = "";
notifications = 0;

/**
 *
 * @param o Object <a> of pressed link on the navbar
 */
function callPage(o) {
    $(".navbar-nav li.active").toggleClass("active");
    o.parentNode.classList.add("active");
    $.ajax({
        url: '',
        type: 'post',
        data: {
            act: 'change_page',
            page: o.id
        },
        success: function(){
            //location.reload();
        }
    });
}


function check_locked() {
    $.get(
        ".",
        {act: "check_locked"},
        function (data) {
            if (data >0) {
                bell.removeClass("fa-bell-slash");
                bell.addClass("fa-bell");
                if (document.title.indexOf('(*)')) document.title = "(*) "+ document.title;
                $("#navbar_bell > ul > li").remove();
                $('#navbar_bell > ul').append("<li><a id='get_locked' href='#'>"+notif.locked+" <span class='badge'></span></a></li>");
                $("#navbar_bell .badge").html(data);
                $("#get_locked").click(get_locked);
                notifications = data;
            } else if (notifications) {
                bell.removeClass("fa-bell");
                bell.addClass("fa-bell-slash");
                $("#navbar_bell > ul > li").remove();
                $('#navbar_bell > ul').append("<li class='disabled'><a href='#'>"+notif.nothing+"</a></li>");
                $("#navbar_bell .badge").html("");
                notifications = 0;
            }
        }
    )
}

function get_locked() {
    $.get(
        ".",
        {act:"get_locked"},
        function (data) {
            if (data != "false") {
                $("#myModalLabel").html(mymodal.locked_title);
                $("#myModal .btn-primary").html(mymodal.unlock);
                var templatediv = "<table id='locked_list'>" +
                    "<thead><tr>" +
                    "<th></th><th>"+mymodal.user+"</th><th>"+mymodal.locktime+"</th>" +
                    "</tr></thead>" +
                    "<tbody></tbody></div>";
                $("#myModalBody").html(templatediv);
                $("#locked_list").addClass("table")
                    .addClass("table-condensed")
                    .addClass("table-striped")
                    .addClass("table-hover")
                    .addClass("table-responsive");
                pdata = JSON.parse(data);
                $("#locked_list").fancytree({
                    idPrefix: "ftlu_",
                    cookieId: "ftlu_",
                    source: pdata,
                    extensions: ["glyph", "table", "gridnav"],
                    glyph: glyph_opts,
                    icon: glyph_opts.map.User,
                    table: {
                        indentation: 20,
                        nodeColumnIdx: 1,
                        checkboxColumnIdx: 0
                    },
                    gridnav: {
                        autofocusInput: false,
                        handleCursorKeys: true
                    },
                    selectMode: 2,
                    checkbox: true,
                    strings: ft_strings,
                    renderColumns: function (e, d) {
                        var node = d.node,
                            $tdList = $(node.tr).find(">td");
                        $tdList.eq(2).text(node.data.locktime)
                    }
                });
                $("#locked_list > tbody > tr > td:nth-child(3)").css("text-align","center");
                $("#myModal .btn-primary").click(function () {
                    s = $.map($("#locked_list").fancytree("getTree").getSelectedNodes(), function (node) {
                        return node.key;
                    });
                    $.get(
                        ".",
                        {
                            act: "unlock",
                            ul: s
                        },
                        function (data) {
                            if (data!="ok") {
                                $("#myModalBody").prepend("<div class='alert alert-dismissible alert-danger'>"+data+"</div>")
                            } else {
                                $("#myModal").modal("toggle");
                                check_locked();
                            }
                        }
                    );
                });
                $("#myModal").modal();
            } else check_locked();

        }
    )
}



$(function() {
    bell = $("#navbar_bell > a > i");
    
    //start checking for locked users
    setInterval(check_locked, 20000);

    //enable bs tooltips
    $('[data-toggle="tooltip"]').tooltip();

    //
    $(".navbar-link").click(function (e) {
        callPage(this);
    });

    //create folders tree
    $("#tree").fancytree({
        extensions : ["glyph", "persist", "wide"],
        glyph: glyph_opts,
        generateIds: true,
        idPrefix: "ftt_",
        cookieId: "ftt_",
        source : {
            url: "index.php",
            data: {
                act: "get_folders"
            }
        },
        lazyLoad: function (event, data) {
            data.result = {
                url: "index.php",
                data: {
                    act: "get_folders",
                    path: data.node.key
                }
            }
        },
        toggleEffect: {
            effect: "drop",
            options: {
                direction: "left"
            },
            duration: 200
        },
        wide: {
            iconWidth: "1em",
            iconSpacing: "0.5em",
            levelOfs: "1.5em"
        },
        persist: {
            expandLazy: true
        },
        strings: ft_strings,
        activate: function (e, data) {
            node = data.node;
            selected_node = node.key;
            $("#objects").fancytree(
                "option",
                "source",
                {
                    url: "index.php",
                    data: {act: "get_objects", path: selected_node},
                    success: function () {}
                }
            )

        }


    });

    $("#objects").fancytree({
        idPrefix:"fto_",
        cookieId:"fto_",
        strings: ft_strings,
        extensions: ["persist", "table", "edit", "glyph" ],
        glyph: glyph_opts,
        icon: function (e, data) {
            type = data.node.data.type;
            if (type) {
                return glyph_opts.map[type];
            }
        },
        activate: function (event, data) {
        },
        table: {
            indentation: 20,
            nodeColumnIdx: 1,
            checkboxColumnIdx: 0
        },
        renderColumns:function(e,data){
            var node = data.node,
                $tdList = $(node.tr).find(">td");
            $tdList.eq(2).text(node.data.dtype)
        },
        checkbox:true,
        selectMode: 2,
        source: []
    });

    //collapsing
    $("#navbar_tree_btn").click(function () {
        $("#main-row .collapse").collapse('toggle');
        $("#navbar_tree_btn").toggleClass('active');

    });

    check_locked();
    
});






