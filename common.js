/* Freecell common functions. Copyright (c) 2006 Alex Curtis. */
 
/* Debugging output */
function Report( msg )
{
    if( debug_on )
    {
        var t = document.forms[0].elements[0];
        t.value = t.value + msg + '\n';
    }
}

/* Clear debugging output */
function ClearReport()
{
    if( debug_on )
    {
        var t = document.forms[0].elements[0];
        t.value = '';
    }
}

function LogError( error_message )
{
    // Log the error somewhere TODO
    Report( error_message );
}

function MoveImage( image_name, x, y, z )
{    
//    Report( "MoveImage( " + image_name + ", " + x + ", " + y + ", " + z + " )" );
    var image = document.getElementById( image_name );
    image.style.left=x;
    image.style.top=y;
    image.style.zIndex=z;
}


