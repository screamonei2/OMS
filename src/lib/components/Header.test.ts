import { render, screen } from '@testing-library/svelte'
import Header from './Header.svelte'
import { describe, it, expect } from 'vitest'

describe('Header component', () => {
  it('renders the brand logo', () => {
    render(Header)
    const brandElement = screen.getByTestId('brand-logo')
    expect(brandElement).toBeInTheDocument()
  })
})
