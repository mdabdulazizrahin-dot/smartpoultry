<?php
/**
 * The front page template file
 *
 * @package Bye_Bye_Poultry
 */

get_header();
?>

<!-- Financial Summary Section -->
<section class="financial-grid feature-section">
    <div class="summary-card profit">
        <div class="label">নীট লাভ</div>
        <div class="value"><?php echo esc_html(bye_bye_poultry_format_currency(0)); ?></div>
    </div>
    
    <div class="summary-small-grid">
        <div class="summary-card income">
            <div class="label">মোট আয়</div>
            <div class="value"><?php echo esc_html(bye_bye_poultry_format_currency(0)); ?></div>
        </div>
        <div class="summary-card expense">
            <div class="label">মোট ব্যয়</div>
            <div class="value"><?php echo esc_html(bye_bye_poultry_format_currency(0)); ?></div>
        </div>
    </div>
</section>

<!-- Navigation Tabs -->
<nav class="nav-tabs" aria-label="<?php esc_attr_e('Main features', 'bye-bye-poultry'); ?>">
    <a href="#charts" class="nav-tab active">
        <i data-lucide="bar-chart-3"></i>
        <span>চার্ট</span>
    </a>
    <a href="#expenses" class="nav-tab">
        <i data-lucide="calculator"></i>
        <span>খরচ</span>
    </a>
    <a href="#sales" class="nav-tab">
        <i data-lucide="egg"></i>
        <span>বিক্রি</span>
    </a>
    <a href="#flock" class="nav-tab">
        <i data-lucide="bird"></i>
        <span>মুরগি</span>
    </a>
    <a href="#medicine" class="nav-tab">
        <i data-lucide="syringe"></i>
        <span>ওষুধ</span>
    </a>
</nav>

<nav class="nav-tabs cols-4" aria-label="<?php esc_attr_e('More features', 'bye-bye-poultry'); ?>">
    <a href="#feed" class="nav-tab">
        <i data-lucide="package"></i>
        <span>খাদ্য</span>
    </a>
    <a href="#production" class="nav-tab">
        <i data-lucide="trending-up"></i>
        <span>উৎপাদন</span>
    </a>
    <a href="#mortality" class="nav-tab">
        <i data-lucide="skull"></i>
        <span>মৃত্যু</span>
    </a>
    <a href="#dealer" class="nav-tab">
        <i data-lucide="store"></i>
        <span>ডিলার</span>
    </a>
</nav>

<nav class="nav-tabs cols-4" aria-label="<?php esc_attr_e('Reports', 'bye-bye-poultry'); ?>">
    <a href="#medicine-expense" class="nav-tab">
        <i data-lucide="pill"></i>
        <span>ওষুধ খরচ</span>
    </a>
    <a href="#misc" class="nav-tab">
        <i data-lucide="receipt"></i>
        <span>অন্যান্য</span>
    </a>
    <a href="#report" class="nav-tab">
        <i data-lucide="file-text"></i>
        <span>রিপোর্ট</span>
    </a>
    <span class="nav-tab" style="visibility: hidden;"></span>
</nav>

<!-- Content Sections -->
<div class="tab-content mt-4">
    
    <!-- Charts Section -->
    <section id="charts" class="feature-section">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i data-lucide="bar-chart-3"></i>
                    গ্রাফ ও চার্ট
                </h3>
            </div>
            <div class="card-content">
                <p class="text-muted">আপনার খামারের পারফরম্যান্স চার্ট এখানে দেখুন।</p>
                <div class="chart-placeholder" style="height: 200px; background: hsl(var(--muted)); border-radius: var(--radius); display: flex; align-items: center; justify-content: center;">
                    <span class="text-muted">চার্ট লোড হচ্ছে...</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Expenses Section -->
    <section id="expenses" class="feature-section">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i data-lucide="calculator"></i>
                    মাসিক খরচ
                </h3>
            </div>
            <div class="card-content">
                <form class="expense-form">
                    <div class="form-group">
                        <label class="form-label" for="electricity">বিদ্যুৎ বিল</label>
                        <input type="number" id="electricity" class="form-input" placeholder="টাকা">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="medicine-cost">ওষুধ খরচ</label>
                        <input type="number" id="medicine-cost" class="form-input" placeholder="টাকা">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="feed-cost">খাদ্য খরচ</label>
                        <input type="number" id="feed-cost" class="form-input" placeholder="টাকা">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="other-cost">অন্যান্য খরচ</label>
                        <input type="number" id="other-cost" class="form-input" placeholder="টাকা">
                    </div>
                    <button type="submit" class="btn btn-primary">সংরক্ষণ করুন</button>
                </form>
            </div>
        </div>
    </section>

    <!-- Egg Sales Section -->
    <section id="sales" class="feature-section">
        <div class="card">
            <div class="card-header flex justify-between items-center">
                <h3 class="card-title">
                    <i data-lucide="egg"></i>
                    ডিম বিক্রি
                </h3>
                <button class="btn btn-primary btn-sm">+ যোগ করুন</button>
            </div>
            <div class="card-content">
                <p class="text-muted text-center">এখনো কোনো বিক্রি যোগ করা হয়নি</p>
            </div>
        </div>
    </section>

    <!-- Flock Section -->
    <section id="flock" class="feature-section">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i data-lucide="bird"></i>
                    মুরগির বয়স
                </h3>
            </div>
            <div class="card-content">
                <div class="form-group">
                    <label class="form-label" for="arrival-date">মুরগি আনার তারিখ</label>
                    <input type="date" id="arrival-date" class="form-input">
                </div>
                <div class="age-display text-center mt-4">
                    <div class="text-muted">বয়স</div>
                    <div class="text-2xl font-bold text-primary">-- সপ্তাহ</div>
                </div>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h3 class="card-title">
                    <i data-lucide="syringe"></i>
                    ভ্যাকসিন রিকমেন্ডেশন
                </h3>
            </div>
            <div class="card-content">
                <p class="text-muted">প্রথমে মুরগি আনার তারিখ নির্ধারণ করুন</p>
            </div>
        </div>
    </section>

    <!-- Feed Section -->
    <section id="feed" class="feature-section">
        <div class="card">
            <div class="card-header flex justify-between items-center">
                <h3 class="card-title">
                    <i data-lucide="package"></i>
                    খাদ্য (ফিড) হিসাব
                </h3>
                <button class="btn btn-primary btn-sm">+ যোগ করুন</button>
            </div>
            <div class="card-content">
                <div class="summary-row flex justify-between items-center mb-4">
                    <span>মোট বস্তা:</span>
                    <span class="badge">০টি</span>
                </div>
                <div class="summary-row flex justify-between items-center">
                    <span>মোট খরচ:</span>
                    <span class="badge badge-warning"><?php echo esc_html(bye_bye_poultry_format_currency(0)); ?></span>
                </div>
            </div>
        </div>
    </section>

    <!-- Production Section -->
    <section id="production" class="feature-section">
        <div class="card">
            <div class="card-header flex justify-between items-center">
                <h3 class="card-title">
                    <i data-lucide="trending-up"></i>
                    ডিম উৎপাদন
                </h3>
                <button class="btn btn-primary btn-sm">+ যোগ করুন</button>
            </div>
            <div class="card-content">
                <div class="production-stats flex justify-between mb-4">
                    <div class="stat text-center">
                        <div class="text-muted text-sm">আজকের উৎপাদন</div>
                        <div class="text-lg font-bold">০ পিস</div>
                    </div>
                    <div class="stat text-center">
                        <div class="text-muted text-sm">উৎপাদন হার</div>
                        <div class="text-lg font-bold text-primary">০%</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Mortality Section -->
    <section id="mortality" class="feature-section">
        <div class="card">
            <div class="card-header flex justify-between items-center">
                <h3 class="card-title">
                    <i data-lucide="skull"></i>
                    মৃত্যু হিসাব
                </h3>
                <button class="btn btn-primary btn-sm">+ যোগ করুন</button>
            </div>
            <div class="card-content">
                <div class="mortality-stats">
                    <div class="list-item">
                        <span>প্রাথমিক সংখ্যা:</span>
                        <span class="badge">০ পিস</span>
                    </div>
                    <div class="list-item">
                        <span>মোট মৃত্যু:</span>
                        <span class="badge badge-destructive">০ পিস</span>
                    </div>
                    <div class="list-item">
                        <span>বর্তমান জীবিত:</span>
                        <span class="badge badge-success">০ পিস</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Dealer Section -->
    <section id="dealer" class="feature-section">
        <div class="card">
            <div class="card-header flex justify-between items-center">
                <h3 class="card-title">
                    <i data-lucide="store"></i>
                    ডিলার পেমেন্ট
                </h3>
                <button class="btn btn-primary btn-sm">+ ডিলার যোগ করুন</button>
            </div>
            <div class="card-content">
                <p class="text-muted text-center">কোনো ডিলার যোগ করা হয়নি</p>
            </div>
        </div>
    </section>

    <!-- Medicine Expense Section -->
    <section id="medicine-expense" class="feature-section">
        <div class="card">
            <div class="card-header flex justify-between items-center">
                <h3 class="card-title">
                    <i data-lucide="pill"></i>
                    ওষুধ খরচ
                </h3>
                <button class="btn btn-primary btn-sm">+ যোগ করুন</button>
            </div>
            <div class="card-content">
                <div class="summary-row flex justify-between items-center mb-4">
                    <span>মোট খরচ:</span>
                    <span class="badge badge-warning"><?php echo esc_html(bye_bye_poultry_format_currency(0)); ?></span>
                </div>
                <p class="text-muted text-center">কোনো ওষুধ কেনার হিসাব নেই</p>
            </div>
        </div>
    </section>

    <!-- Misc Expenses Section -->
    <section id="misc" class="feature-section">
        <div class="card">
            <div class="card-header flex justify-between items-center">
                <h3 class="card-title">
                    <i data-lucide="receipt"></i>
                    অন্যান্য খরচ
                </h3>
                <button class="btn btn-primary btn-sm">+ যোগ করুন</button>
            </div>
            <div class="card-content">
                <div class="summary-row flex justify-between items-center mb-4">
                    <span>মোট খরচ:</span>
                    <span class="badge badge-warning"><?php echo esc_html(bye_bye_poultry_format_currency(0)); ?></span>
                </div>
                <p class="text-muted text-center">কোনো অন্যান্য খরচের হিসাব নেই</p>
            </div>
        </div>
    </section>

    <!-- Report Section -->
    <section id="report" class="feature-section">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i data-lucide="file-text"></i>
                    রিপোর্ট ডাউনলোড
                </h3>
            </div>
            <div class="card-content">
                <div class="flex gap-4">
                    <button class="btn btn-primary flex-1">
                        <i data-lucide="download"></i>
                        PDF রিপোর্ট
                    </button>
                    <button class="btn btn-secondary flex-1">
                        <i data-lucide="file-spreadsheet"></i>
                        CSV এক্সপোর্ট
                    </button>
                </div>
            </div>
        </div>
    </section>

</div><!-- .tab-content -->

<?php
get_footer();
