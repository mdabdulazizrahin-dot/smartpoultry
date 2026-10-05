<?php
/**
 * Bye Bye Poultry Farm Theme Functions
 *
 * @package Bye_Bye_Poultry
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Theme Setup
 */
function bye_bye_poultry_setup() {
    // Add default posts and comments RSS feed links to head
    add_theme_support('automatic-feed-links');

    // Let WordPress manage the document title
    add_theme_support('title-tag');

    // Enable support for Post Thumbnails
    add_theme_support('post-thumbnails');

    // Register navigation menus
    register_nav_menus(array(
        'primary' => esc_html__('Primary Menu', 'bye-bye-poultry'),
        'footer'  => esc_html__('Footer Menu', 'bye-bye-poultry'),
    ));

    // Switch default core markup to output valid HTML5
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ));

    // Add support for custom logo
    add_theme_support('custom-logo', array(
        'height'      => 100,
        'width'       => 400,
        'flex-height' => true,
        'flex-width'  => true,
    ));

    // Add support for responsive embeds
    add_theme_support('responsive-embeds');

    // Add support for wide alignment
    add_theme_support('align-wide');

    // Add support for editor styles
    add_theme_support('editor-styles');
}
add_action('after_setup_theme', 'bye_bye_poultry_setup');

/**
 * Set the content width
 */
function bye_bye_poultry_content_width() {
    $GLOBALS['content_width'] = apply_filters('bye_bye_poultry_content_width', 512);
}
add_action('after_setup_theme', 'bye_bye_poultry_content_width', 0);

/**
 * Enqueue scripts and styles
 */
function bye_bye_poultry_scripts() {
    // Main stylesheet
    wp_enqueue_style(
        'bye-bye-poultry-style',
        get_stylesheet_uri(),
        array(),
        wp_get_theme()->get('Version')
    );

    // Google Fonts - Hind Siliguri
    wp_enqueue_style(
        'bye-bye-poultry-fonts',
        'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap',
        array(),
        null
    );

    // Lucide Icons (CDN) - Load in header for faster icon rendering
    wp_enqueue_script(
        'lucide-icons',
        'https://unpkg.com/lucide@0.263.1/dist/umd/lucide.min.js',
        array(),
        '0.263.1',
        false  // Load in header
    );

    // Theme custom scripts - Load in footer
    wp_enqueue_script(
        'bye-bye-poultry-scripts',
        get_template_directory_uri() . '/assets/js/main.js',
        array('lucide-icons'),
        wp_get_theme()->get('Version'),
        true  // Load in footer
    );

    // Initialize Lucide icons inline after page load
    wp_add_inline_script('bye-bye-poultry-scripts', 
        'document.addEventListener("DOMContentLoaded", function() { if(typeof lucide !== "undefined") lucide.createIcons(); });'
    );
}
add_action('wp_enqueue_scripts', 'bye_bye_poultry_scripts');

/**
 * Register widget areas
 */
function bye_bye_poultry_widgets_init() {
    register_sidebar(array(
        'name'          => esc_html__('Sidebar', 'bye-bye-poultry'),
        'id'            => 'sidebar-1',
        'description'   => esc_html__('Add widgets here.', 'bye-bye-poultry'),
        'before_widget' => '<section id="%1$s" class="widget %2$s card">',
        'after_widget'  => '</section>',
        'before_title'  => '<h3 class="widget-title card-title">',
        'after_title'   => '</h3>',
    ));

    register_sidebar(array(
        'name'          => esc_html__('Footer Widget', 'bye-bye-poultry'),
        'id'            => 'footer-1',
        'description'   => esc_html__('Add footer widgets here.', 'bye-bye-poultry'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="widget-title">',
        'after_title'   => '</h4>',
    ));
}
add_action('widgets_init', 'bye_bye_poultry_widgets_init');

/**
 * Custom template tags
 */

/**
 * Display formatted Bengali number
 */
function bye_bye_poultry_bengali_number($number) {
    $bengali_digits = array('০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯');
    $english_digits = array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9');
    return str_replace($english_digits, $bengali_digits, $number);
}

/**
 * Format currency in BDT
 */
function bye_bye_poultry_format_currency($amount) {
    $formatted = number_format($amount, 0);
    return '৳ ' . bye_bye_poultry_bengali_number($formatted);
}

/**
 * Add custom body classes
 */
function bye_bye_poultry_body_classes($classes) {
    // Add a class if there is a custom logo
    if (has_custom_logo()) {
        $classes[] = 'has-custom-logo';
    }

    // Add class for single column layout
    $classes[] = 'single-column';

    return $classes;
}
add_filter('body_class', 'bye_bye_poultry_body_classes');

/**
 * Security: Remove WordPress version from head
 */
remove_action('wp_head', 'wp_generator');

/**
 * Security: Disable XML-RPC
 */
add_filter('xmlrpc_enabled', '__return_false');

/**
 * Customizer additions
 */
function bye_bye_poultry_customize_register($wp_customize) {
    // Farm Settings Section
    $wp_customize->add_section('bye_bye_poultry_farm_settings', array(
        'title'    => __('Farm Settings', 'bye-bye-poultry'),
        'priority' => 30,
    ));

    // Farm Name
    $wp_customize->add_setting('farm_name', array(
        'default'           => 'Bye Bye Poultry Farm',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'refresh',
    ));

    $wp_customize->add_control('farm_name', array(
        'label'   => __('Farm Name', 'bye-bye-poultry'),
        'section' => 'bye_bye_poultry_farm_settings',
        'type'    => 'text',
    ));

    // Farm Description
    $wp_customize->add_setting('farm_description', array(
        'default'           => 'আপনার খামারের সেরা সঙ্গী',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'refresh',
    ));

    $wp_customize->add_control('farm_description', array(
        'label'   => __('Farm Description', 'bye-bye-poultry'),
        'section' => 'bye_bye_poultry_farm_settings',
        'type'    => 'text',
    ));

    // Contact Phone
    $wp_customize->add_setting('contact_phone', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'refresh',
    ));

    $wp_customize->add_control('contact_phone', array(
        'label'   => __('Contact Phone', 'bye-bye-poultry'),
        'section' => 'bye_bye_poultry_farm_settings',
        'type'    => 'tel',
    ));
}
add_action('customize_register', 'bye_bye_poultry_customize_register');

/**
 * Helper function to get theme mod with default
 */
function bye_bye_poultry_get_option($option, $default = '') {
    return get_theme_mod($option, $default);
}
