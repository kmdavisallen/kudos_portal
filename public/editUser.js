function editUser(id){

    var formdata = new FormData(document.getElementById("edit-profile"));
    $.ajax({
        url: '/userHome/editProfile/' + id,
        type: 'PUT',
        data: formdata,
        success: function(result){
           window.location.replace('./')
        },
        contentType: false,
        processData: false
    })
};