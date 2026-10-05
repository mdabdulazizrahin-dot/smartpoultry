import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HatcherySupplierSelect, PREDEFINED_HATCHERIES } from '../components/poultry/HatcherySupplierSelect';

describe('HatcherySupplierSelect', () => {
  it('has exactly the 7 predefined companies required', () => {
    expect(PREDEFINED_HATCHERIES.map(h => h.label)).toEqual([
      'Kazi / কাজী',
      'CP / সিপি',
      'Nourish / নওরিশ',
      'Paragon / প্যারাগন',
      'Aftab / আফতাব',
      'Nahar / নাহার',
      'ACI / এসিআই',
    ]);
    expect(PREDEFINED_HATCHERIES.length).toBe(7);
  });

  it('renders helper text properly', () => {
    render(<HatcherySupplierSelect value="" onChange={() => {}} />);
    expect(
      screen.getByText('বাচ্চা কোথা থেকে কিনেছেন সেই হ্যাচারি/কোম্পানির নাম নির্বাচন করুন')
    ).toBeInTheDocument();
  });

  it('displays non-predefined legacy supplier in "অন্যান্য" custom input (backward compatibility)', () => {
    const handleChange = vi.fn();
    render(
      <HatcherySupplierSelect
        value="Aman Hatchery Ltd"
        onChange={handleChange}
      />
    );

    const input = screen.getByPlaceholderText('হ্যাচারি/সরবরাহকারীর নাম লিখুন') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Aman Hatchery Ltd');

    fireEvent.change(input, { target: { value: 'Aman Hatchery Updated' } });
    expect(handleChange).toHaveBeenCalledWith('Aman Hatchery Updated');
  });

  it('does not show custom input when predefined company is provided', () => {
    render(
      <HatcherySupplierSelect
        value="Nourish"
        onChange={() => {}}
      />
    );

    expect(screen.queryByPlaceholderText('হ্যাচারি/সরবরাহকারীর নাম লিখুন')).toBeNull();
  });

  it('clearing selection invokes onChange with empty string', () => {
    const handleChange = vi.fn();
    render(
      <HatcherySupplierSelect
        value="Kazi"
        onChange={handleChange}
      />
    );

    const clearBtn = screen.getByTitle('মুছে ফেলুন');
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith('');
  });
});
