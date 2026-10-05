        </div><!-- .container -->
    </main><!-- #primary -->

    <footer id="colophon" class="site-footer">
        <div class="container">
            <?php if (is_active_sidebar('footer-1')) : ?>
                <div class="footer-widgets">
                    <?php dynamic_sidebar('footer-1'); ?>
                </div>
            <?php endif; ?>
            
            <p class="copyright">
                © <?php echo esc_html(bye_bye_poultry_bengali_number('2026')); ?>
                <?php echo esc_html(bye_bye_poultry_get_option('farm_name', get_bloginfo('name'))); ?>
            </p>
            <p class="tagline">আপনার খামারের সেরা সঙ্গী 🐔</p>
            
            <?php
            $contact_phone = bye_bye_poultry_get_option('contact_phone');
            if ($contact_phone) :
            ?>
                <p class="contact">
                    <a href="tel:<?php echo esc_attr($contact_phone); ?>">
                        📞 <?php echo esc_html($contact_phone); ?>
                    </a>
                </p>
            <?php endif; ?>
        </div>
    </footer><!-- #colophon -->

</div><!-- #page -->

<script>
    // Initialize Lucide icons
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
</script>

<?php wp_footer(); ?>

</body>
</html>
