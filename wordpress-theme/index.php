<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 *
 * @package Bye_Bye_Poultry
 */

get_header();
?>

<?php if (have_posts()) : ?>
    
    <div class="posts-container">
        <?php while (have_posts()) : the_post(); ?>
            
            <article id="post-<?php the_ID(); ?>" <?php post_class('card'); ?>>
                <header class="card-header">
                    <?php if (is_singular()) : ?>
                        <h1 class="card-title entry-title"><?php the_title(); ?></h1>
                    <?php else : ?>
                        <h2 class="card-title entry-title">
                            <a href="<?php the_permalink(); ?>" rel="bookmark"><?php the_title(); ?></a>
                        </h2>
                    <?php endif; ?>
                    
                    <div class="entry-meta text-muted text-sm mt-2">
                        <time datetime="<?php echo esc_attr(get_the_date('c')); ?>">
                            <?php echo esc_html(bye_bye_poultry_bengali_number(get_the_date())); ?>
                        </time>
                    </div>
                </header>

                <?php if (has_post_thumbnail() && !is_singular()) : ?>
                    <div class="post-thumbnail mb-4">
                        <a href="<?php the_permalink(); ?>">
                            <?php the_post_thumbnail('medium', array('class' => 'featured-image', 'style' => 'width: 100%; height: auto; border-radius: var(--radius);')); ?>
                        </a>
                    </div>
                <?php endif; ?>

                <div class="card-content entry-content">
                    <?php
                    if (is_singular()) :
                        the_content();
                        
                        wp_link_pages(array(
                            'before' => '<div class="page-links">' . esc_html__('Pages:', 'bye-bye-poultry'),
                            'after'  => '</div>',
                        ));
                    else :
                        the_excerpt();
                    ?>
                        <a href="<?php the_permalink(); ?>" class="btn btn-primary btn-sm mt-4">
                            <?php esc_html_e('বিস্তারিত পড়ুন', 'bye-bye-poultry'); ?>
                        </a>
                    <?php endif; ?>
                </div>

                <?php if (is_singular()) : ?>
                    <footer class="entry-footer mt-4 pt-4" style="border-top: 1px solid hsl(var(--border));">
                        <?php
                        $categories_list = get_the_category_list(', ');
                        if ($categories_list) :
                        ?>
                            <span class="cat-links text-sm text-muted">
                                <i data-lucide="folder" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i>
                                <?php echo $categories_list; ?>
                            </span>
                        <?php endif; ?>

                        <?php
                        $tags_list = get_the_tag_list('', ', ');
                        if ($tags_list) :
                        ?>
                            <span class="tags-links text-sm text-muted ml-4">
                                <i data-lucide="tag" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i>
                                <?php echo $tags_list; ?>
                            </span>
                        <?php endif; ?>
                    </footer>
                <?php endif; ?>
            </article>

        <?php endwhile; ?>
    </div>

    <?php
    // Pagination
    the_posts_pagination(array(
        'mid_size'  => 2,
        'prev_text' => '← ' . esc_html__('আগের', 'bye-bye-poultry'),
        'next_text' => esc_html__('পরের', 'bye-bye-poultry') . ' →',
    ));
    ?>

<?php else : ?>

    <div class="card">
        <div class="card-content text-center">
            <h2 class="text-lg mb-4"><?php esc_html_e('কোনো পোস্ট পাওয়া যায়নি', 'bye-bye-poultry'); ?></h2>
            <p class="text-muted"><?php esc_html_e('দুঃখিত, আপনার অনুসন্ধানের সাথে মিলে এমন কিছু পাওয়া যায়নি।', 'bye-bye-poultry'); ?></p>
        </div>
    </div>

<?php endif; ?>

<?php
get_footer();
