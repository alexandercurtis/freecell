/*
 * Freecell in Javascript.
 * This program, and all associated graphics images and other material is Copyright (c) 2006 Alexander Curtis.
 * You may not copy, distribute, modify or sell them without written permission from the original author.
 */

/*
 TODO:
 CURRENTLY:
    play testing

    can put card from free cell on to ANY pile!
    set peek timer v. long and check for bugs
    success message



 */

/* The following definitions should come from the html file
by the way IE barfs on const
const margin_left = 8; // gap at left of playing aream
const margin_top = 8; // gap at top of playing area
const card_width = 72;
const card_height = 96;
const pile_spacing = 5; // gap between piles
const card_separation = 7; // space between cards in a pile
const margin_horizontal = 8; // space between bottom of cells and top of piles
const margin_vertical = 32; // space between rightmost cell and left most house
const debug_on = 1; // Enable debug output
*/

var positions = {
    space  : 8,
    house  : 9,
    nowhere: 10
}

function Position( pos, loc )
{
    this.pos = pos; // Either a pile (0-7), space (positions.space), house (positions.house), or nowhere.
    this.loc = loc; // Where in pile (0 is bottom, also used for screen z order), space (0 is leftmost), house (0 is leftmost)
    this.x = 0; // Screen coordinate
    this.y = 0; // Screen coordinate
}

/*
var card.prototype = {
    value: 0,
    position: new position( positions.nowhere, 0 )
}
*/
function Card( id )
{
    this.id = id; // Which actual card (1-52)
    this.pos = new Position( positions.nowhere, 0 ); // Logical postion and screen position.
}

Card.prototype.toString = function() {
    return HumanName( this.id ) + "(" + this.pos.loc + ")";
};

Card.prototype.getid = function() { return this.id; };

// Used to look up a card object reference, given only a card id
var the_cards = new Array(
    null, // No card with id = 0.
    new Card(1),  new Card(2),  new Card(3),  new Card(4),  new Card(5),  new Card(6),  new Card(7),  new Card(8),  new Card(9),  new Card(10), new Card(11), new Card(12), new Card(13),
    new Card(14), new Card(15), new Card(16), new Card(17), new Card(18), new Card(19), new Card(20), new Card(21), new Card(22), new Card(23), new Card(24), new Card(25), new Card(26),
    new Card(27), new Card(28), new Card(29), new Card(30), new Card(31), new Card(32), new Card(33), new Card(34), new Card(35), new Card(36), new Card(37), new Card(38), new Card(39),
    new Card(40), new Card(41), new Card(42), new Card(43), new Card(44), new Card(45), new Card(46), new Card(47), new Card(48), new Card(49), new Card(50), new Card(51), new Card(52)
);

// An array of card id's representing the ordering of the cards in a notional deck which is used to deal from.
var the_deck = new Array(
 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,
14,15,16,17,18,19,20,21,22,23,24,25,26,
27,28,29,30,31,32,33,34,35,36,37,38,39,
40,41,42,43,44,45,46,47,48,49,50,51,52
);

// Represents the 8 piles of cards in play.
var the_piles = [ [], [], [], [], [], [], [], [] ];

// Represents the free cells. Each entry is a card reference.
var the_cells = new Array( null,null, null, null );

// Represents the final home cells. Each entry is a single card reference of the topmost card in the house.
var the_houses = new Array( null, null, null, null );

// Reference to the currently peeked-at card
var current_card = null;

// Reference to the currently selected card
var selected_card = null;

// Pseudo-random number generator, used so that games can be re-played by seeding the PRNG with the same seed.
function PseudoRandom( n )
{
    return Math.floor( Math.random() * n );
}

// Shuffles the notional deck, prior to dealing
function ShuffleDeck()
{
    for( var i=0; i<51; i++ )
    {
        var card_pos = PseudoRandom( 51-i ) + i + 1;
        var card_id = the_deck[ card_pos ];
        the_deck[ card_pos ] = the_deck[ i ];
        the_deck[ i ] = card_id;
    }
}

// Deals the pack into logical piles.
// Updates logical and screen location records for the cards.
// Doesn't actually draw anything on the screen.
function DealDeck()
{
    for( var i=0; i<52; i++ )
    {
        var pile_num = i%8;
        var pile_size = the_piles[ pile_num ].length;
        var this_card = the_cards[ the_deck[i] ];

        //Report( "pile_num = " + pile_num + " pile_size = " + pile_size + " i=" + i + " the_deck = " + the_deck[i] );
        //Report( "this card = " + this_card.id );

        // Record new screen location of the card
        this_card.pos.x = pile_num*(card_width+pile_spacing) + margin_left;
        this_card.pos.y = pile_size*card_separation + card_height+margin_top+margin_horizontal;

        // Record new logical location of the card, in the card object
        this_card.pos.pos = pile_num;
        this_card.pos.loc = pile_size;

        // Record new logical location of the card, in the piles array
        the_piles[ pile_num ].push( this_card );
    }
}

// Sets the bays and baize in position
function InitialiseTable()
{
    MoveImage( "0", 0, 0, 0 ); // baize
    MoveImage( "c0", margin_left, margin_top, 0 ); // cell 0
    MoveImage( "c1", margin_left+card_width, margin_top, 0 ); // cell 1
    MoveImage( "c2", margin_left+card_width*2, margin_top, 0 ); // cell 2
    MoveImage( "c3", margin_left+card_width*3, margin_top, 0 ); // cell 3
    MoveImage( "h0", margin_left+card_width*4+margin_vertical, margin_top, 0 ); // house 0
    MoveImage( "h1", margin_left+card_width*4+margin_vertical+card_width, margin_top, 0 ); // house 1
    MoveImage( "h2", margin_left+card_width*4+margin_vertical+card_width*2, margin_top, 0 ); // house 2
    MoveImage( "h3", margin_left+card_width*4+margin_vertical+card_width*3, margin_top, 0 ); // house 3
    MoveImage( "p0", margin_left, margin_top+card_height+margin_horizontal, 0 ); // pile 0
    MoveImage( "p1", margin_left+(card_width+pile_spacing),  margin_top+card_height+margin_horizontal, 0 ); // pile 1
    MoveImage( "p2", margin_left+(card_width+pile_spacing)*2,  margin_top+card_height+margin_horizontal, 0 ); // pile 2
    MoveImage( "p3", margin_left+(card_width+pile_spacing)*3,  margin_top+card_height+margin_horizontal, 0 ); // pile 3
    MoveImage( "p4", margin_left+(card_width+pile_spacing)*4,  margin_top+card_height+margin_horizontal, 0 ); // pile 4
    MoveImage( "p5", margin_left+(card_width+pile_spacing)*5,  margin_top+card_height+margin_horizontal, 0 ); // pile 5
    MoveImage( "p6", margin_left+(card_width+pile_spacing)*6,  margin_top+card_height+margin_horizontal, 0 ); // pile 6
    MoveImage( "p7", margin_left+(card_width+pile_spacing)*7,  margin_top+card_height+margin_horizontal, 0 ); // pile 7

}

function HighlightImage( image_name, highlighted )
{
    var image = document.getElementById( image_name );
    if( highlighted )
    {
        image.style.border = "2px solid blue";
    }
    else
    {
        image.style.border = "none";
    }
}

/*
function ShowImage( image_name, show )
{
    var image = document.getElementById( image_name );

    if( show )
    {
        image.style.visibility="visible";
    }
    else
    {
        image.style.visibility="hidden";
    }
}*/

// Actually places the images on the screen according to their logical locations in the piles.
function DrawDeck()
{
    for( var i=0; i<8; i++ )
    {
        for( j in the_piles[i] )
        {

            var this_card = the_piles[i][j];
            MoveImage( this_card.id, this_card.pos.x, this_card.pos.y, this_card.pos.loc );
        }
    }
}

// Handles the timeout for showing an obscured card, by replacing the card in its correct position.
function ClickTimeout()
{
    if( current_card != null )
    {
        MoveImage( current_card.id, current_card.pos.x, current_card.pos.y, current_card.pos.loc );
    }
}

// Converts a card id to a readable string, for debugging use.
function HumanName( id )
{
    var suits = [ "H", "C", "D", "S" ];

    var name = Math.floor( (id-1) / 4 ) + 1;
    name += suits[ Math.floor( (id-1) % 4 ) ];
    return name;
}

// Decides whether a card is allowed to sit on another card according to the game rules
function HowManyWillGoOn( pile, dest_card )
{
    // How many free cells are there? (include one for players hand)
    var free_cells = ((the_cells[0] == null)?1:0) + ((the_cells[1] == null)?1:0) + ((the_cells[2] == null)?1:0) + ((the_cells[3] == null)?1:0) + 1;

    // Include any free bays
    for( var i = 0; i<8; i++ )
    {
        if( the_piles[i].length == 0 )
        {
            free_cells++;
        }
    }

    var num = 0;
    var card_index = pile.length - 1;

//    Report( "HowManyWillGoOn() free_cells=" + free_cells + " card_index = " + card_index + " src pile = " + pile + " dest card = " + dest_card );

    if( dest_card != null )
    {
//        Report( "Putting on a pile" );
        while( card_index >= 0 )
        {
            var src_card = pile[ card_index ];
            if( num < free_cells && WillGo( src_card.id, dest_card.id ) )
            {
                return num+1;
            }
            else if( card_index == 0 || !WillGo( src_card.id, pile[ card_index - 1 ].id ) )
            {
                return 0;
            }
            num++;
            card_index--;
        }
    }
    else
    {
        free_cells--; // Don't count the bay we're using
//        Report( "Putting on a bay. free_cells=" + free_cells + " num=" + num + " cardindex=" + card_index );
        while( num < free_cells && card_index >= 0 )
        {
            num++;
            var src_card = pile[ card_index ];
            if( card_index == 0 || !WillGo( src_card.id, pile[ card_index - 1 ].id ) )
            {
                Report(" no parent for " + src_card + ". returnign " + num );
                return num;
            }
            Report( "card " + card_index + " " + src_card + " has parent" );
            card_index--;
        }
        return num;
    }

    /* old way
    while( num < free_cells )
    {
        var src_card = pile[ card_index ];
        if( dest_card == null || WillGo( src_card.id, dest_card.id ) )
        {
            num++;
            if( dest_card != null )
            {
                // This will be the only match we find.
                Report( "Found match at num " + num );
                return num;
            }
        }
        // By here, either current card won't go, or we are filling an empty pile, so keep going back through parents.
        if( card_index > 0 && WillGo( src_card.id, pile[ card_index - 1 ].id ) )
        {
            // Card has a parent.
            card_index--;
            if( dest_card != null )
            {
                num++;
            }
            // else card gets counted next time round loop

        }
        else if( dest_card == null )
        {
            // Put all we found on pile
            Report( "Empty pile will take " + num );
            return num;
        }
        else
        {
            // Reached last parent, nothing would go.
            Report( "nothing would go" );
            return 0;
        }
    }
    if( dest_card == null )
    {
        Report( "Tested all cards, found " + (num-1) );
        return num-1;
    }
    Report( "Ran out of hands." );
    return 0;
    */
}

// Decides whether a card is allowed to sit on another card according to the game rules
function WillGo( candidate_id, subject_id )
{
    // id's go from Ace to King, but first through H, C, D, S.
    var candidate_colour = Math.floor(candidate_id % 2); // 0 = black, 1 = red
    var candidate_value = Math.floor((candidate_id-1) / 4); // 0= Ace, 1 = 2, etc.
    var subject_colour = Math.floor(subject_id % 2); // 0 = black, 1 = red
    var subject_value = Math.floor((subject_id-1) / 4); // 0= Ace, 1 = 2, etc.

    return ( candidate_colour != subject_colour && candidate_value+1 == subject_value );
}

// Decides whether a card is allowed to go on a home pile
function CanGoHome( candidate_id, subject_id )
{
    // id's go from Ace to King, but first through H, C, D, S.
    var candidate_suit = Math.floor(candidate_id % 4); // 0 = H, 1=C, 2=D, 3=S
    var candidate_value = Math.floor((candidate_id-1) / 4); // 0= Ace, 1 = 2, etc.
    var subject_suit = Math.floor(subject_id % 4); // 0 = H, 1=C, 2=D, 3=S
    var subject_value = Math.floor((subject_id-1) / 4); // 0= Ace, 1 = 2, etc.

    //Report( "CanGoHome( " + candidate_value + " of " + candidate_suit + " to " + subject_value + " of " + subject_suit);

    return( candidate_suit == subject_suit && candidate_value == subject_value + 1 );
}


// Event handler for user clicking a card image
function CardClicked( card_id )
{
    ClearReport();
    Report( "CardClicked( "+ HumanName(card_id) + " ) selected_card = " + selected_card );

    // Look up the card object instance for the clicked image
    var this_card = the_cards[ card_id ];

    if( this_card == selected_card )
    {
//        Report( "Already selected." );
        HighlightImage( selected_card.id, false );
        selected_card = null;
        AutoPlay();
        return;
    }

    var pile_num = this_card.pos.pos;
    var pile_index = this_card.pos.loc;
    if( pile_num <= 7 )
    {
        if( pile_index == the_piles[ pile_num ].length - 1 )
        {
            // Topmost card in pile
            PileClicked( pile_num );
        }
        else
        {
            // Card obscured by other cards
//            Report( "Flashing card" );

            // Move it to the top
            MoveImage( this_card.id, this_card.pos.x, this_card.pos.y, 53 );

            // Remember it for when timer expires
            current_card = this_card;

            // Start timer
        	setTimeout( "ClickTimeout()", 500 );
        }
    }
    else if( pile_num == positions.space )
    {
        if( selected_card == null )  // Not trying to put a card on this one
        {
            HighlightImage( this_card.id, true );
            // Remember it
            selected_card = this_card;
        }
    }
    else if( pile_num == positions.house )
    {
        HouseClicked( pile_index );
    }

}


// Event handler for user clicking the table behind the cards
function BaizeClicked()
{
    Report( "BaizeClicked()"  );

    if( selected_card != null )
    {
        // Deselect the card
        HighlightImage( selected_card.id, false );
        selected_card = null;
    }
}

// Event handler for user clicking a free cell
function CellClicked( cell_num )
{
    Report( "CellClicked(" + cell_num + ") selected_card=" + selected_card + " cell contains " + the_cells[ cell_num ] );
    if( selected_card != null )
    {
        if( the_cells[ cell_num ] == null ) // Should be , otherwise CardClicked() will be called.
        {
            HighlightImage( selected_card.id, false );

            // Move card to empty cell
            MoveCards( selected_card.pos.pos, selected_card.pos.loc, 1, positions.space, cell_num );

            // Deselect the card
            selected_card = null;

            AutoPlay();

        }
    }
}

// Event handler for user clicking a house
function HouseClicked( house_num )
{
    Report( "HouseClicked(" + house_num + ") selected_card=" + selected_card + " cell contains " + the_houses[ house_num ]  );
    if( selected_card != null )
    {
//        Report( "the_houses[ house_num ] = " + the_houses[ house_num ] + " selected_card.id = " + selected_card.id )
        if( (the_houses[ house_num ] == null && selected_card.id <= 4) || (the_houses[ house_num ] != null && CanGoHome( selected_card.id, the_houses[ house_num ].id )) )
        {
            // Move card to home cell

            HighlightImage( selected_card.id, false );
            MoveCards( selected_card.pos.pos, selected_card.pos.loc, 1, positions.house, house_num );

            // Deselect the card
            selected_card = null;
        }
    }
}

/*
// Returns reference to the card instance on top of the given pile, or null if pile is empty
function WhatsOnTop( pile_num )
{
    var l = the_piles[ pile_num ].length;
    if( l == 0 )
    {
        return null;
    }
    return the_piles[ pile_num ][ l-1 ];
}
*/

// Handles clicking in a pile, either empty or full
function PileClicked( pile_num )
{
    var this_card = null;
    if( the_piles[ pile_num ].length > 0 )
    {
        this_card = the_piles[ pile_num ][ the_piles[ pile_num ].length-1 ];
    }

    Report( "PileClicked(" + pile_num + ") selected_card=" + selected_card + " pile contains " + the_piles[ pile_num ]  );
    if( selected_card != null )
    {
      Report( "(pos=" + selected_card.pos.pos + ")" );
        var selected_pile_num = selected_card.pos.pos;
        var selected_pile = null;
        var num = 0;
        if( selected_pile_num <= 7 )
        {
            selected_pile = the_piles[ selected_pile_num ];
            num = HowManyWillGoOn( selected_pile, this_card );
        }
        else if( selected_card.pos.pos == positions.space )
        {
          if( this_card == null || WillGo(  selected_card.id, this_card.id ) )
          {
            num = 1;
          }
        }

        if( num > 0 )
        {
//            Report( num + " will go!" );

            // Update the screen
            HighlightImage( selected_card.id, false );

            // Move selected cards to new pile
            MoveCards( selected_pile_num, selected_card.pos.loc, num, pile_num, 0 );

            selected_card = null;
        }

        AutoPlay();

    }
    else
    {
//        Report( "New selection." );

        HighlightImage( this_card.id, true );
        // Remember it
        selected_card = this_card;
    }

}

// Generic card moving function.
// src_pos is position to move card(s) from.
// src_loc is cell/house number to move card from.
// dest_pos is position to move card(s) to.
// dest_loc is cell/house number to move card to.
// num is number of cards to move.
// No checking of move validity is done. That should be done by the caller.
// Selected card un-highlighting should be done by caller.
// If dest_pos is not a pile, only one card is moved, and num is ignored.
// If src_pos is not a pile, only one card is moved, and num is ignored.
// If src_pos is a pile, src_loc is ignored.
// If dest_pos is a pile, dest_loc is ignored.
function MoveCards( src_pos, src_loc, num, dest_pos, dest_loc )
{
    Report( "MoveCards( " + src_pos + ", " + src_loc + ", " + num + ", " + dest_pos + ", " + dest_loc + " )" );

    var src_pile = null;
    if( src_pos <= 7 )
    {
        src_pile = the_piles[ src_pos ];
//        Report( "src_pile = " + src_pile );
    }
    else
    {
        num = 1; // Ensure only one card is moved
    }

    var start_index = 0;
    if( src_pile )
    {
        start_index = src_pile.length - num;
    }


    var y = 0;
    var dest_pile = null;
    if( dest_pos <= 7 )
    {
        dest_pile = the_piles[ dest_pos ];
        y = dest_pile.length * card_separation + card_height+margin_top+margin_horizontal;
        dest_loc = dest_pile.length;
//        Report( "dest_pile = " + dest_pile );
    }
    else
    {
        num = 1; // Ensure only one card is moved
    }

    var from_index = start_index;
    var to_index = dest_loc;

    for( var i=0; i < num; i++ )
    {
        var a_card = null;
        if( src_pile )
        {
            a_card = src_pile[ from_index ];
        }
        else if( src_pos == positions.space )
        {
            a_card = the_cells[ src_loc ];
        }
        else if( src_pos == positions.house )
        {
            a_card = the_houses[ src_loc ];
        }

        if( a_card )
        {
            if( dest_pos <= 7 )
            {
                a_card.pos.pos = dest_pos;
                a_card.pos.loc = to_index;
                a_card.pos.x = dest_pos*(card_width+pile_spacing) + 8;
                a_card.pos.y = y;
            }
            else if( dest_pos == positions.space )
            {
//Report( "x=" + a_card.pos.x );
                a_card.pos.pos = dest_pos;
                a_card.pos.loc = dest_loc;
                a_card.pos.x = dest_loc*(card_width) + 8;
                a_card.pos.y = 8;
//Report( "x=" + a_card.pos.x );
            }
            else if( dest_pos == positions.house )
            {
                a_card.pos.pos = dest_pos;
                a_card.pos.loc = dest_loc;
                a_card.pos.x = dest_loc*(card_width) + margin_left+(4*card_width)+margin_vertical;
                a_card.pos.y = 8;
            }
            MoveImage( a_card.id, a_card.pos.x, a_card.pos.y, a_card.pos.loc );
        }


        y += card_separation;
        from_index++;
        to_index++;
    }

    // Update the_piles
    var from_array = new Array();
    if( src_pile )
    {
//        Report(" start_index=" + start_index + ", num=" + num );
        from_array = src_pile.splice( start_index, num );
    }
    else if( src_pos == positions.space )
    {
        from_array.push( the_cells[ src_loc ] );
        the_cells[ src_loc ] = null;
    }
    else if( src_pos == positions.house )
    {
        from_array.push( the_houses[ src_loc ] );
        the_houses[ src_loc ] = null;
    }

//        Report(" from = " + from_array );
    if( dest_pos <= 7 )
    {
        the_piles[ dest_pos ] = dest_pile.concat( from_array );
    }
    else if( dest_pos == positions.space )
    {
        the_cells[ dest_loc ] = from_array.pop();
    }
    else if( dest_pos == positions.house )
    {
        the_houses[ dest_loc ] = from_array.pop();
    }

    //DebugDump();
}

// Dumps logical state for debugging purposes
function DebugDump()
{
    Report("Cells:" + the_cells[0] + ", " + the_cells[1] + ", " + the_cells[2] + ", " + the_cells[3] );
    Report("Houses:" + the_houses[0] + ", " + the_houses[1] + ", " + the_houses[2] + ", " + the_houses[3] );
    for( var i=0; i<8; i++ )
    {
        Report("Pile " + i + ":" + the_piles[i] );
    }
}



// Returns number of possible moves open
function Stuck( cards_in_play )
{

    var how_many_options = 0;

    Report("stuckx for " + cards_in_play );
    for( var i=0; i<4; i++ )
    {
        var a_card = the_cells[i];
        if( a_card == null )
        {
            how_many_options+= cards_in_play.length;
            return 2; // Not accurate but all we need to detect is 0,1 or many....
        }
    }

    for( var i=0; i<8; i++ )
    {
        if( the_piles[i].length == 0 )
        {
            return 2; // Not accurate but all we need to detect is 0,1 or many....
        }
    }

    for( var a_card_i in cards_in_play )
    {
        var a_card = cards_in_play[a_card_i];

        for( var i=0; i<8; i++ )
        {
           //redundant from earlier check:
           var l = the_piles[i].length;
           if( l>0 )
            {
                var b_card = the_piles[i][l-1];
                if( WillGo( a_card.id, b_card.id ) )
                {
                    how_many_options++;
                }
            }
        }

        for( var i=0; i<4; i++ )
        {
            if( (the_houses[ i ] == null && a_card.id <= 4) || (the_houses[ i ] != null && CanGoHome( a_card.id, the_houses[ i ].id )) )
            {
                how_many_options++;
            }
        }
    }

    Report("stuckx unstuck="+how_many_options);
    return how_many_options;
}

// Puts cards on house piles.
// Returns 1 if no moves left.
function AutoPlay()
{
    var restart = 1;
    while( restart != 0 )
    {
        restart = 0;

        // Create a list containing all top cards, and all cell cards
        var cards_in_play = new Array();

        for( var i=0; i<4; i++ )
        {
            a_card = the_cells[i];
            if( a_card != null )
            {
                cards_in_play.push( a_card );
            }
        }
        for( var i=0; i<8; i++ )
        {
            var l = the_piles[i].length;
            if( l>0 )
            {
                cards_in_play.push( the_piles[i][l-1] );
            }
        }
        Report( "Cards in play are " + cards_in_play );

        for( var a_card_i in cards_in_play )
        {
            var a_card = cards_in_play[a_card_i];
            Report( "testing : " + a_card );

            for( var i=0; i<4; i++ )
            {
                Report( "testing house: " + i );
                if( (the_houses[ i ] == null && a_card.id <= 4) || (the_houses[ i ] != null && CanGoHome( a_card.id, the_houses[ i ].id )) )
                {
                    // Check if any card in play will go on this
                    // (do this in reverse - check if the cards that will go on this are in play)
                    var free_to_move = 0;
                    if( a_card.id <= 8 ) // Always send aces and twos home
                    {
                        free_to_move = 1;
                    }
                    else
                    {
                        var val = Math.floor( (a_card.id-1) / 4 );
                        var suit = (a_card.id-1) % 4;
                        Report( "Thinking of moving " + val + " of " + suit );
                        val = (val-1) * 4; // The value of the cards that will go on this one
                        var suit1 = (suit+1) % 4; // The first opposing suit
                        var suit2 = (suit+3) % 4; // The second opposing suit
                        Report( "What will go is " + val + " of " +suit1 + " or " + suit2 );
                        if( the_cards[ val + suit1 ].pos.pos == positions.house
                         && the_cards[ val + suit2 ].pos.pos == positions.house )
                        {
                            // Both cards are out of play so we can move this one.
                            free_to_move = 1;
                        }
                    }
                    Report( "free_to_move="+free_to_move );
                    if( free_to_move )
                    {
                        var next_card = null;
                        if( a_card.pos.pos < 8 && a_card.pos.loc > 0)
                        {
                            next_card = the_piles[ a_card.pos.pos ][a_card.pos.loc-1];
                        }
                        Report( "a_card= " + a_card + ", next_card=" + next_card );

                        if( next_card == null )
                        {
                            cards_in_play.splice( a_card_i,1 );
                        }
                        else
                        {
                            cards_in_play.splice( a_card_i,1,next_card );
                        }

                        MoveCards( a_card.pos.pos, a_card.pos.loc, 1, positions.house, i );
                        restart = 1;
                    }
                    break;
                }
            }
        }
    }

    if( cards_in_play.length == 0 )
    {
        alert( "Well done!!! Reload page to play again." );
    }
    else
    {
      var num_options = Stuck( cards_in_play );
      if( num_options == 0 )
      {
          alert( "No moves left!" );
      }
      /*else if( num_options == 1 )
      {
          alert( "Only one move open..." );
      }*/
    }
}
