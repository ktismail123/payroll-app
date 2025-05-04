import * as React from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface BreadcrumbProps {
  className?: string;
  items: {
    label: string;
    href?: string;
  }[];
}

export function Breadcrumb({ className, items }: BreadcrumbProps) {
  return (
    <nav className={cn("mb-4", className)}>
      <ol className="flex text-sm items-center">
        <li className="flex items-center">
          <Link href="/">
            <a className="text-primary hover:text-primary-dark flex items-center">
              <Home className="h-4 w-4 mr-1" />
              Home
            </a>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-2 text-neutral-medium" />
            {item.href ? (
              <Link href={item.href}>
                <a className="text-primary hover:text-primary-dark">
                  {item.label}
                </a>
              </Link>
            ) : (
              <span className="text-neutral-dark">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
