# Play Store পাবলিশ গাইড - Smart Poultry

## ধাপ ১: প্রজেক্ট সেটআপ

```bash
# GitHub থেকে ক্লোন করুন
git clone <your-repo-url>
cd <project-folder>

# Dependencies ইনস্টল
npm install

# Android প্ল্যাটফর্ম যোগ
npx cap add android
```

## ধাপ ২: আইকন ও স্প্ল্যাশ স্ক্রিন

Android Studio তে `android/app/src/main/res/` ফোল্ডারে নিচের সাইজে আইকন রাখুন:

| ফোল্ডার | সাইজ |
|---------|------|
| mipmap-mdpi | 48x48 |
| mipmap-hdpi | 72x72 |
| mipmap-xhdpi | 96x96 |
| mipmap-xxhdpi | 144x144 |
| mipmap-xxxhdpi | 192x192 |

**অথবা** Android Studio → Resource Manager → Image Asset ব্যবহার করুন।

## ধাপ ৩: Signing Key তৈরি

```bash
# Keystore তৈরি (এটি নিরাপদে রাখুন!)
keytool -genkey -v -keystore smart-poultry.keystore -alias smartpoultry -keyalg RSA -keysize 2048 -validity 10000
```

## ধাপ ৪: Release Build

```bash
# প্রথমে ওয়েব বিল্ড
npm run build

# Capacitor সিঙ্ক
npx cap sync android

# Android Studio খুলুন
npx cap open android
```

**Android Studio তে:**
1. Build → Generate Signed Bundle / APK
2. Android App Bundle (AAB) সিলেক্ট করুন
3. Keystore path, password দিন
4. Release সিলেক্ট করে Finish

## ধাপ ৫: Google Play Console

### প্রয়োজনীয় তথ্য:
- **App Name:** Smart Poultry
- **Package Name:** com.smartpoultry.app
- **Category:** Business / Productivity
- **Content Rating:** Everyone

### প্রয়োজনীয় Assets:
| Asset | সাইজ |
|-------|------|
| App Icon | 512x512 PNG |
| Feature Graphic | 1024x500 PNG |
| Screenshots (Phone) | min 2টি, 16:9 বা 9:16 |
| Screenshots (Tablet) | min 1টি (optional) |

### Privacy Policy
আপনার একটি Privacy Policy URL দরকার হবে। এটি একটি ওয়েবপেজ হতে হবে যেখানে আপনার অ্যাপ কি ডাটা সংগ্রহ করে তা লেখা থাকবে।

## ধাপ ৬: App Bundle আপলোড

1. [Google Play Console](https://play.google.com/console) এ যান
2. নতুন App তৈরি করুন
3. Production → Create new release
4. AAB ফাইল আপলোড করুন
5. সব তথ্য পূরণ করে Submit করুন

## গুরুত্বপূর্ণ টিপস

⚠️ **Keystore হারাবেন না!** - হারালে আর আপডেট দিতে পারবেন না
⚠️ **Package name পরে পরিবর্তন করা যায় না**
⚠️ Google Play Developer Account ফি: $25 (একবারের জন্য)

## সাহায্য দরকার?

- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
