/**
 * Image Utils - Centralized image imports for the application
 * This file contains all image assets used throughout the app
 * for better organization and reusability
 */

// Logo Images
export const LogoMain = require('@assets/images/logo_main.png');
export const Logo = require('@assets/images/logo.jpeg');

// General Images
export const CloudImage = require('@assets/images/cloud.png');
export const DeliveryBoyImage = require('@assets/images/delivery_boy.png');
export const Image1 = require('@assets/images/1.png');

// Image utility functions
export const ImageUtils = {
  /**
   * Get logo image based on type
   * @param type - 'main' for logo_main.png, 'jpeg' for logo.jpeg
   * @returns Image source
   */
  getLogo: (type: 'main' | 'jpeg' = 'main') => {
    return type === 'main' ? LogoMain : Logo;
  },

  /**
   * Get image with fallback
   * @param primaryImage - Primary image source
   * @param fallbackImage - Fallback image source
   * @returns Image source with fallback
   */
  getImageWithFallback: (primaryImage: any, fallbackImage: any) => {
    return primaryImage || fallbackImage;
  },

  /**
   * Common image styles for different use cases
   */
  styles: {
    logo: {
      height: 200,
      width: 200,
      resizeMode: 'contain' as const,
    },
    smallLogo: {
      height: 50,
      width: 50,
      resizeMode: 'contain' as const,
    },
    largeLogo: {
      height: 300,
      width: 300,
      resizeMode: 'contain' as const,
    },
    icon: {
      height: 24,
      width: 24,
      resizeMode: 'contain' as const,
    },
    thumbnail: {
      height: 80,
      width: 80,
      resizeMode: 'cover' as const,
    },
  },
};

// Export all images as a single object for easy destructuring
export const Images = {
  LogoMain,
  Logo,
  CloudImage,
  DeliveryBoyImage,
  Image1,
};

export default Images;
