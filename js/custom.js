// $(document).ready(function(){

//     let mealToGo = $('[data-w-id="b86d5b07-1ad5-8d99-e186-3fcf2e81699e"]');
//     let comboMeals = $('[data-w-id="b86d5b07-1ad5-8d99-e186-3fcf2e81699f"]');
    
//     mealToGo.on('click', mealToGoMenu);
//     comboMeals.on('click', comboMealMenu);

//     function mealToGoMenu() {
//         let mealToGoMenu = $('.meal_to_go');
//         let chickenMenu = $('.chicken');
//         let navigationMenu = $('.div-block-128');

//         mealToGoMenu.css('display', 'block');
//         mealToGoMenu.css('opacity', '1');
//         chickenMenu.css('display', 'none');
//         navigationMenu.css('display','none');
//     }

//     function comboMealMenu() {
//         let comboMeal = $('.combo_meals');
//         let chickenMenu = $('.chicken');
//         let navigationMenu = $('.div-block-128');

//         comboMeal.css('opacity', '1');
//         comboMeal.css('display', 'block');
//         chickenMenu.css('display', 'none');
//         navigationMenu.css('display','none');
//     }


// }); 

$(document).ready(function(){
    // Attach click event to all menu links
    $('.nav_link-6').on('click', function(event) {
        event.preventDefault();

        const menuClass = $(this).data('menu'); // Get the menu name directly

        if (menuClass) {
            showMenu(menuClass);
        } else {
            console.warn('Missing data-menu attribute for this link.');
        }
    });


    // Function to show the correct menu
    function showMenu(menuClass) {
        let navigationMenu = $('.div-block-128');
        // Hide all menus
        $('.mealstogo, .combomeals, .sisig, .chicken, .pork, .desserts, .breakfast, .stuffed, .rice, .sodas, .alcodrinks, .vegie' ).css({
            display: 'none',
            opacity: '0'
        });
        navigationMenu.css('display','none');

        // Show the selected menu
        const selectedMenu = $('.' + menuClass);
        if (selectedMenu.length) {
            selectedMenu.css({
                display: 'block',
                opacity: '1'
            });
        } else {
            console.warn('No element found for menu:', menuClass);
        }
    } 

}); 




