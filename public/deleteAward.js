function deleteAward(id){
    $.ajax({
        url: '/userHome/manageawards/' + id,
        type: "DELETE",
        success: function(result){
            window.location.reload(true);
        }
    })
};