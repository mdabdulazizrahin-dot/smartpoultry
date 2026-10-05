<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#16a34a">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="<?php echo esc_attr(bye_bye_poultry_get_option('farm_name', 'Poultry Farm')); ?>">
    
    <?php if (!has_site_icon()) : ?>
    <link rel="apple-touch-icon" href="<?php echo esc_url(get_template_directory_uri()); ?>/assets/images/icon-192.png">
    <?php endif; ?>
    
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div id="page" class="site">
    <a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e('Skip to content', 'bye-bye-poultry'); ?></a>

    <header id="masthead" class="site-header">
        <div class="container">
            <div class="farm-icon">🐔</div>
            
            <?php if (has_custom_logo()) : ?>
                <div class="site-logo">
                    <?php the_custom_logo(); ?>
                </div>
            <?php endif; ?>
            
            <h1 class="site-title">
                <?php echo esc_html(bye_bye_poultry_get_option('farm_name', get_bloginfo('name'))); ?>
            </h1>
            
            <?php
            $description = bye_bye_poultry_get_option('farm_description', get_bloginfo('description'));
            if ($description) :
            ?>
                <p class="site-description"><?php echo esc_html($description); ?></p>
            <?php endif; ?>
        </div>
    </header><!-- #masthead -->

    <main id="primary" class="site-main">
        <div class="container">
