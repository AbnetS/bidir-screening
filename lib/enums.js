var APPL_ERROR_CODES = Object.freeze({
    DEFAULT_ERROR: {
        message : 'Something Went Wrong ☹ ',
        code: 400
    },
    AUTHORIZATION_ERROR: {
        message: 'You are not authorized to perform this action',
        code: 403
    },

    //MFI related errors
    MFI_CREATION_ERROR: {
        message: 'MFI cannot be created',
        code: 422
    },
    MFI_EXIST_ERROR: {
        code: 422,//may be changed later
        message: 'A Microfinance Institution has already been registered.'    
    },
    NON_EXISTENT_LOGO:{
        "code": "400",
        "message":"Logo should be provided!",
        "source":"logo"
    },
    INVALID_LOGO_FILE: {
        "code": "400",//change it                      
        'message':"Only image files (jpg|jpeg|png) are Allowed as a logo file!",
        "source":'logo'
    },
    INVALID_LOGO_FIELD: {
        "code": "400",//change it                      
        'message':"Field name for the logo file should be 'logo'!",
        "source":'logo'
    },
    TOO_BIG_LOGO_FILE: {
        "code": "400",//change it                      
        'message':"File size can not exceed 1MB!",
        "source":'logo'
    },
    MFI_DOES_NOT_EXIST: {
        "code": "400",//change it                      
        'message':"MFI by the given Id does not exist!"        
    },
    INVALID_MFI_ID: {
        "code": "404",//change it                      
        'message':"Invalid MFI Id!"        
    },
    MFI_NOT_REGISTERED: {
        "code": "400",//change it                      
        'message':"MFI is not registered! Please register the MFI first."        
    },

    //Branch related errors
    BRANCH_NAME_EXISTS:{
        "code": 400,
        "message":"A branch with this name exists!"
    },
    BRANCH_DOES_NOT_EXIST:{
        "code": 400,
        "message":"A branch by the given Id does not exist!"
    },

    //Search Errors
    SEARCH_PARAM_NOT_GIVEN:{
        "code": 400,
        "message":"Search query parameters are not provided!"
    },
    INVALID_SEARCH_PARAM:{
        "code": 400,
        "message":"Invalid search query parameters are provided!"        
    }  
});

var MODULES = Object.freeze({
    MFI_SETUP:       1,
    USER_MANAGEMENT: 2
})

exports.APPL_ERROR_CODES = APPL_ERROR_CODES;
exports.MODULES = MODULES;
